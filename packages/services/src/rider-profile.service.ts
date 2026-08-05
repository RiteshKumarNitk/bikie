import { riderProfileRepository } from "@bikie/database";
import type { RiderProfileDTO } from "@bikie/types";
import type { RiderProfileInput } from "@bikie/validation";

export const RiderProfileService = {
  async getMine(userId: string): Promise<RiderProfileDTO | null> {
    return riderProfileRepository.findByUserId(userId);
  },

  async needsOnboarding(userId: string): Promise<boolean> {
    const completed = await riderProfileRepository.hasCompletedOnboardingGate(userId);
    return !completed;
  },

  /** Skipped onboarding and never substantively filled the profile in since — worth a gentle
   * reminder on Home. See `riderProfileRepository.needsCompletionReminder` for exactly what
   * "substantively filled in" means. */
  async needsCompletionReminder(userId: string): Promise<boolean> {
    return riderProfileRepository.needsCompletionReminder(userId);
  },

  async saveMine(userId: string, input: RiderProfileInput): Promise<RiderProfileDTO> {
    return riderProfileRepository.upsertProfile(userId, input);
  },

  async skip(userId: string): Promise<void> {
    await riderProfileRepository.markOnboardingSkipped(userId);
  },
};
