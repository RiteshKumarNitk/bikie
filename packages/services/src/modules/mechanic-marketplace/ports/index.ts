export interface PartnerLookupPort {
  findPartnerByUserId(userId: string): Promise<{ id: string; type: string } | null>;
  /** Partner.id → the owning User's id — needed because `Notification.userId` points at `User`,
   * not `Partner`, and a listing/request only ever carries the Partner row's own id. */
  findUserIdByPartnerId(partnerId: string): Promise<string | null>;
}

export interface MechanicListingRow {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrls: string[];
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MechanicListingRepositoryPort {
  createListing(input: {
    partnerId: string;
    title: string;
    description: string;
    category: string;
    price: number;
    imageUrls: string[];
    latitude?: number | null;
    longitude?: number | null;
    serviceRadiusKm?: number;
  }): Promise<MechanicListingRow>;
  updateOwnListing(
    id: string,
    partnerId: string,
    data: Partial<{
      title: string;
      description: string;
      category: string;
      price: number;
      imageUrls: string[];
      latitude: number | null;
      longitude: number | null;
      serviceRadiusKm: number;
      isActive: boolean;
    }>,
  ): Promise<MechanicListingRow | null>;
  deactivateOwnListing(id: string, partnerId: string): Promise<boolean>;
  findOwnListings(partnerId: string): Promise<MechanicListingRow[]>;
  findListingById(id: string): Promise<MechanicListingRow | null>;
  findNearbyActiveListings(filters: { category?: string; maxPrice?: number }): Promise<MechanicListingRow[]>;
}

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

export interface RequestWithContext extends MechanicRequestRow {
  listing: { id: string; title: string; partnerId: string };
  rider: { id: string; name: string };
}

export type TransitionResult =
  | { ok: true; row: MechanicRequestRow; listingPartnerId: string; riderId: string; listingTitle: string }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" };

export interface MechanicRequestRepositoryPort {
  createRequest(input: {
    listingId: string;
    riderId: string;
    quotedPrice: number;
    message?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<MechanicRequestRow>;
  findRequestById(id: string): Promise<RequestWithContext | null>;
  findRequestsForRider(riderId: string): Promise<MechanicRequestRow[]>;
  findRequestsForPartner(partnerId: string): Promise<Array<MechanicRequestRow & { listingTitle: string; riderName: string }>>;
  transitionStatus(
    id: string,
    fromStatus: string,
    toStatus: string,
    extra?: { decidedAt?: Date; completedAt?: Date },
  ): Promise<TransitionResult>;
}

export interface MechanicNotificationPort {
  notify(userId: string, type: string, title: string, body: string, entity?: string, entityId?: string): Promise<void>;
}

export interface MechanicMarketplacePorts {
  partners: PartnerLookupPort;
  listings: MechanicListingRepositoryPort;
  requests: MechanicRequestRepositoryPort;
  notifications: MechanicNotificationPort;
}
