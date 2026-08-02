import { toE164Phone } from "./modules/communications/domain/phone";
import {
  getSafetyLocationModule,
  type FanOutDeps,
  type SOSDispatchSummary,
  type SOSRecipient,
  type SOSRecipientRole,
} from "./modules/safety-location/public";
import type { SOSAlertDTO } from "@bikie/types";

export type { SOSRecipientRole, SOSRecipient, SOSDispatchSummary, FanOutDeps as SOSDispatchDeps };

export { toE164Phone };

/**
 * Compatibility facade — fan-out policy lives in safety-location application.
 * Optional `communications` override preserved for tests/injection.
 */
export const SOSDispatchService = {
  async fanOut(alert: SOSAlertDTO, deps: FanOutDeps = {}): Promise<SOSDispatchSummary> {
    return getSafetyLocationModule().dispatch.fanOut(alert, deps);
  },
};
