import type { BikeSummaryDTO } from "./bike";

export interface DestinationSummaryDTO {
  id: string;
  slug: string;
  name: string;
  state: string;
  imageUrl: string;
  bikeCount: number;
}

export interface DestinationDetailDTO extends DestinationSummaryDTO {
  description: string | null;
  bikes: BikeSummaryDTO[];
}
