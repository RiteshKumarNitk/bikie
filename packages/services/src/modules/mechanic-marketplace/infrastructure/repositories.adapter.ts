import { mechanicListingRepository, mechanicRequestRepository, partnerRepository } from "@bikie/database";
import { NotificationService } from "../../../notification.service";
import type {
  MechanicListingRepositoryPort,
  MechanicRequestRepositoryPort,
  MechanicNotificationPort,
  PartnerLookupPort,
} from "../ports";

export function createPartnerLookupAdapter(): PartnerLookupPort {
  return {
    findPartnerByUserId: (userId) => partnerRepository.findPartnerByUserId(userId),
    findUserIdByPartnerId: (partnerId) => partnerRepository.findUserIdByPartnerId(partnerId),
  };
}

export function createMechanicListingRepositoryAdapter(): MechanicListingRepositoryPort {
  return {
    createListing: (input) => mechanicListingRepository.createListing(input),
    updateOwnListing: (id, partnerId, data) => mechanicListingRepository.updateOwnListing(id, partnerId, data),
    deactivateOwnListing: (id, partnerId) => mechanicListingRepository.deactivateOwnListing(id, partnerId),
    findOwnListings: (partnerId) => mechanicListingRepository.findOwnListings(partnerId),
    findListingById: (id) => mechanicListingRepository.findListingById(id),
    findNearbyActiveListings: (filters) => mechanicListingRepository.findNearbyActiveListings(filters),
  };
}

export function createMechanicRequestRepositoryAdapter(): MechanicRequestRepositoryPort {
  return {
    createRequest: (input) => mechanicRequestRepository.createRequest(input),
    findRequestById: (id) => mechanicRequestRepository.findRequestById(id),
    findRequestsForRider: (riderId) => mechanicRequestRepository.findRequestsForRider(riderId),
    findRequestsForPartner: (partnerId) => mechanicRequestRepository.findRequestsForPartner(partnerId),
    transitionStatus: (id, fromStatus, toStatus, extra) =>
      mechanicRequestRepository.transitionStatus(id, fromStatus, toStatus, extra),
  };
}

export function createMechanicNotificationAdapter(): MechanicNotificationPort {
  return {
    notify: (userId, type, title, body, entity, entityId) =>
      NotificationService.notify(userId, type as never, title, body, entity, entityId),
  };
}
