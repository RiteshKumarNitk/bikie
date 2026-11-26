import { prisma } from "../client";

export interface MechanicRequestRow {
  id: string;
  listingId: string;
  riderId: string;
  status: string;
  quotedPrice: number;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
  requestedAt: Date;
  decidedAt: Date | null;
  completedAt: Date | null;
}

function toRow(r: {
  id: string;
  listingId: string;
  riderId: string;
  status: string;
  quotedPrice: { toNumber: () => number };
  message: string | null;
  latitude: number | null;
  longitude: number | null;
  requestedAt: Date;
  decidedAt: Date | null;
  completedAt: Date | null;
}): MechanicRequestRow {
  return { ...r, quotedPrice: r.quotedPrice.toNumber() };
}

/** `quotedPrice` is always the listing's price AT THIS MOMENT, passed in by the application layer
 * right after it reads the listing — never re-derived here or anywhere later, so a listing's price
 * (or deactivation) changing afterward never alters what this specific request is for. */
export async function createRequest(input: {
  listingId: string;
  riderId: string;
  quotedPrice: number;
  message?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<MechanicRequestRow> {
  const created = await prisma.mechanicServiceRequest.create({
    data: {
      listingId: input.listingId,
      riderId: input.riderId,
      quotedPrice: input.quotedPrice,
      message: input.message ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    },
  });
  return toRow(created);
}

export interface RequestWithContext extends MechanicRequestRow {
  listing: { id: string; title: string; partnerId: string };
  rider: { id: string; name: string };
}

/** Includes `listing.partnerId` and the full row (location included) — callers MUST only use
 * this for a viewer who is either the request's own `riderId` or that `partnerId`'s owner; every
 * API route calling this re-checks that before returning anything to the client. Never used to
 * build a list visible to anyone else. */
export async function findRequestById(id: string): Promise<RequestWithContext | null> {
  const row = await prisma.mechanicServiceRequest.findUnique({
    where: { id },
    include: { listing: { select: { id: true, title: true, partnerId: true } }, rider: { select: { id: true, name: true } } },
  });
  return row ? { ...toRow(row), listing: row.listing, rider: row.rider } : null;
}

/** The Rider's own request history — every field including location, since this view is already
 * scoped to `riderId = userId` by construction. */
export async function findRequestsForRider(riderId: string): Promise<MechanicRequestRow[]> {
  const rows = await prisma.mechanicServiceRequest.findMany({
    where: { riderId },
    orderBy: { requestedAt: "desc" },
  });
  return rows.map(toRow);
}

/** A Partner's incoming requests, across all of that Partner's listings. Scoped by `partnerId`
 * through the `listing` relation — a request against a different Partner's listing can never
 * appear here. Full fields (including location) are correct here: the Mechanic is one of the two
 * people this request's location is meant for. */
export async function findRequestsForPartner(partnerId: string): Promise<
  Array<MechanicRequestRow & { listingTitle: string; riderName: string }>
> {
  const rows = await prisma.mechanicServiceRequest.findMany({
    where: { listing: { partnerId } },
    include: { listing: { select: { title: true } }, rider: { select: { name: true } } },
    orderBy: { requestedAt: "desc" },
  });
  return rows.map((r) => ({ ...toRow(r), listingTitle: r.listing.title, riderName: r.rider.name }));
}

export type TransitionResult =
  | { ok: true; row: MechanicRequestRow; listingPartnerId: string; riderId: string; listingTitle: string }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" };

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

/** Single `UPDATE ... WHERE id = ? AND status = ?` — atomic at the Postgres level, no transaction
 * or lock needed. If two requests race to transition the same row, only the first `UPDATE` whose
 * `WHERE` still matches the pre-transition status actually changes anything; `count` tells the
 * caller which happened, so a concurrent duplicate transition is a safe, detectable no-op rather
 * than two conflicting writes or a lost update. Mirrors `approveParticipantAtomically`'s
 * conditional-update pattern in the rides-community module. */
export async function transitionStatus(
  id: string,
  fromStatus: string,
  toStatus: string,
  extra: { decidedAt?: Date; completedAt?: Date } = {},
): Promise<TransitionResult> {
  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) return { ok: false, reason: "INVALID_TRANSITION" };

  const result = await prisma.mechanicServiceRequest.updateMany({
    where: { id, status: fromStatus as never },
    data: { status: toStatus as never, ...extra },
  });
  if (result.count === 0) return { ok: false, reason: "NOT_FOUND" };

  const row = await prisma.mechanicServiceRequest.findUnique({
    where: { id },
    include: { listing: { select: { partnerId: true, title: true } } },
  });
  if (!row) return { ok: false, reason: "NOT_FOUND" };
  return { ok: true, row: toRow(row), listingPartnerId: row.listing.partnerId, riderId: row.riderId, listingTitle: row.listing.title };
}
