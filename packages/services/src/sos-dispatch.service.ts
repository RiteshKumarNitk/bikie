import { toE164Phone } from "./modules/communications/domain/phone";
import {
  getSafetyLocationModule,
  type FanOutDeps,
  type RawSOSAlertDTO,
  type SOSDispatchSummary,
  type SOSRecipient,
  type SOSRecipientRole,
} from "./modules/safety-location/public";

export type { SOSRecipientRole, SOSRecipient, SOSDispatchSummary, FanOutDeps as SOSDispatchDeps };

export { toE164Phone };

/**
 * Compatibility facade — fan-out policy lives in safety-location application. `alert` is always
 * the raw, freshly-created alert (never redacted — see pii-redaction.ts, ADR-045), since dispatch
 * runs immediately after `SOSService.createAlert`, before any HTTP read/redaction boundary.
 * Optional `communications` override preserved for tests/injection.
 */
export const SOSDispatchService = {
  async fanOut(alert: RawSOSAlertDTO, deps: FanOutDeps = {}): Promise<SOSDispatchSummary> {
    return getSafetyLocationModule().dispatch.fanOut(alert, deps);
  },
};
