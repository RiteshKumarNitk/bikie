export interface ReputationStats {
  emergencyResponseCount: number;
  helperRatingAvg: number;
  helperRatingCount: number;
}

export interface ReputationRepositoryPort {
  recordAssist(userId: string): Promise<void>;
  recordRating(userId: string, rating: number): Promise<void>;
  getStats(userId: string): Promise<ReputationStats | null>;
}

export interface ReputationPorts {
  reputation: ReputationRepositoryPort;
}
