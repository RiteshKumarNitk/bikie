/**
 * Severity is always derived server-side from `type` — never trusted from the client, since
 * that would let a reporter mislabel an assistance case as an emergency to jump straight to
 * the ADMIN escalation tier (ADR-033).
 */
const EMERGENCY_TYPES = new Set(["ACCIDENT", "MEDICAL", "LIFE_THREATENING"]);

export function deriveSeverity(type: string): "EMERGENCY" | "ASSISTANCE" {
  return EMERGENCY_TYPES.has(type) ? "EMERGENCY" : "ASSISTANCE";
}
