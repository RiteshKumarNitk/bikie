/** Re-exported from the shared kernel so existing adapter imports (`./http`) keep working —
 * see `packages/services/src/lib/http.ts` for the implementation, shared with identity-access's
 * MSG91 OTP adapters (ADR-034). */
export { fetchWithTimeout, type FetchWithTimeoutInit } from "../../../lib/http";
