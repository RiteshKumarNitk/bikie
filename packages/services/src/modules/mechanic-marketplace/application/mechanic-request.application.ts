import type { MechanicMarketplacePorts, MechanicRequestRow } from "../ports";

// Location-visibility rule (the only two people a request's precise latitude/longitude is ever
// shown to: the Rider who submitted it, and the Partner who owns the listing it's against) is
// enforced by every read path below being all-or-nothing — `getRequestDetail` returns the full
// row or `null`, and the list methods are already scoped to the caller's own rows by query, so
// there's never a partial/redacted view to build.

export function createMechanicRequestApplication(ports: MechanicMarketplacePorts) {
  return {
    /** `quotedPrice` is read from the listing right here, once, and never re-derived — the
     * listing's price (or active/inactive state afterward) can never retroactively change what
     * this request was for. An inactive listing can't be requested against at all. */
    async submitRequest(
      riderId: string,
      input: { listingId: string; message?: string; latitude?: number; longitude?: number },
    ): Promise<{ ok: true; request: MechanicRequestRow } | { ok: false; reason: "LISTING_NOT_FOUND" | "LISTING_INACTIVE" }> {
      const listing = await ports.listings.findListingById(input.listingId);
      if (!listing) return { ok: false, reason: "LISTING_NOT_FOUND" };
      if (!listing.isActive) return { ok: false, reason: "LISTING_INACTIVE" };

      const request = await ports.requests.createRequest({
        listingId: input.listingId,
        riderId,
        quotedPrice: listing.price,
        message: input.message ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      });

      const partnerUserId = await ports.partners.findUserIdByPartnerId(listing.partnerId);
      if (partnerUserId) {
        await ports.notifications.notify(
          partnerUserId,
          "MECHANIC_REQUEST_RECEIVED",
          "New service request",
          `A Rider requested "${listing.title}".`,
          "MechanicServiceRequest",
          request.id,
        );
      }
      return { ok: true, request };
    },

    /** Returns `null` (never a partial/redacted row) if `viewerId` is neither the request's own
     * Rider nor the listing's owning Partner — "not found" is the honest answer for an
     * unauthorized id guess, not "found but redacted", which would itself leak that the id exists. */
    async getRequestDetail(requestId: string, viewerId: string): Promise<MechanicRequestRow | null> {
      const request = await ports.requests.findRequestById(requestId);
      if (!request) return null;
      const partner = await ports.partners.findPartnerByUserId(viewerId);
      const isOwnerRider = request.riderId === viewerId;
      const isOwnerPartner = partner !== null && partner.id === request.listing.partnerId;
      if (!isOwnerRider && !isOwnerPartner) return null;
      return request; // already fully authorized for either party — location included deliberately
    },

    async getRiderHistory(riderId: string): Promise<MechanicRequestRow[]> {
      // Already scoped to riderId by the query itself — never needs redaction.
      return ports.requests.findRequestsForRider(riderId);
    },

    async getPartnerInbox(userId: string): Promise<{ ok: true; requests: Array<MechanicRequestRow & { listingTitle: string; riderName: string }> } | { ok: false; reason: "NOT_A_PARTNER" }> {
      const partner = await ports.partners.findPartnerByUserId(userId);
      if (!partner) return { ok: false, reason: "NOT_A_PARTNER" };
      const requests = await ports.requests.findRequestsForPartner(partner.id);
      // Already scoped to this Partner's own listings — never needs redaction either.
      return { ok: true, requests };
    },

    /** Every transition funnels through here so the atomic-CAS guard and the "only notify on a
     * transition that actually just happened" rule apply uniformly. `actorUserId`'s role
     * (Partner who owns the listing vs. the Rider who owns the request) determines which
     * transitions they're allowed to request at all — enforced before the DB call, not just by
     * what the DB's CAS happens to allow. */
    async transition(
      actorUserId: string,
      requestId: string,
      toStatus: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    ): Promise<{ ok: true; request: MechanicRequestRow } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "INVALID_TRANSITION" }> {
      const existing = await ports.requests.findRequestById(requestId);
      if (!existing) return { ok: false, reason: "NOT_FOUND" };

      const partner = await ports.partners.findPartnerByUserId(actorUserId);
      const isOwnerRider = existing.riderId === actorUserId;
      const isOwnerPartner = partner !== null && partner.id === existing.listing.partnerId;

      const partnerOnlyTransitions = new Set(["ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED"]);
      const riderOnlyTransitions = new Set(["CANCELLED"]);
      if (partnerOnlyTransitions.has(toStatus) && !isOwnerPartner) return { ok: false, reason: "FORBIDDEN" };
      if (riderOnlyTransitions.has(toStatus) && !isOwnerRider && !isOwnerPartner) return { ok: false, reason: "FORBIDDEN" };

      const extra: { decidedAt?: Date; completedAt?: Date } = {};
      if (toStatus === "ACCEPTED" || toStatus === "REJECTED") extra.decidedAt = new Date();
      if (toStatus === "COMPLETED") extra.completedAt = new Date();

      const result = await ports.requests.transitionStatus(requestId, existing.status, toStatus, extra);
      if (!result.ok) return result;

      // Only reached when the CAS update actually flipped the row (count === 1) — a retried or
      // racing duplicate call that lost the CAS returns NOT_FOUND above instead, so this notify
      // can never fire twice for the same real transition.
      if (toStatus === "ACCEPTED") {
        await ports.notifications.notify(
          result.riderId,
          "MECHANIC_REQUEST_ACCEPTED",
          "Request accepted",
          `Your request for "${result.listingTitle}" was accepted.`,
          "MechanicServiceRequest",
          requestId,
        );
      } else if (toStatus === "REJECTED") {
        await ports.notifications.notify(
          result.riderId,
          "MECHANIC_REQUEST_REJECTED",
          "Request declined",
          `Your request for "${result.listingTitle}" was declined.`,
          "MechanicServiceRequest",
          requestId,
        );
      } else {
        // IN_PROGRESS / COMPLETED / CANCELLED — notify whichever side didn't trigger it. The
        // Partner's notifiable id is their owning User.id, not the Partner row's own id, so it's
        // resolved separately rather than assumed to already be a User.id like `riderId` is.
        const partnerUserId = await ports.partners.findUserIdByPartnerId(result.listingPartnerId);
        const notifyUserId = actorUserId === result.riderId ? partnerUserId : result.riderId;
        if (notifyUserId && notifyUserId !== actorUserId) {
          await ports.notifications.notify(
            notifyUserId,
            "MECHANIC_REQUEST_STATUS_CHANGED",
            "Request status updated",
            `The request for "${result.listingTitle}" is now ${toStatus.replace("_", " ").toLowerCase()}.`,
            "MechanicServiceRequest",
            requestId,
          );
        }
      }

      return { ok: true, request: result.row };
    },
  };
}
