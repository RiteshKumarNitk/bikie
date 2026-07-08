import type { BikeSummaryDTO } from "./bike";

export interface WishlistItemDTO {
  id: string;
  createdAt: string;
  bike: BikeSummaryDTO;
}
