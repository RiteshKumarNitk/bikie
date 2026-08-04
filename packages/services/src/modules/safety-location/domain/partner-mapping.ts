/** Which Partner.type is most relevant for a given SOS category — lets the SERVICE_PROVIDERS
 * escalation tier target, say, MECHANIC partners for a breakdown instead of every partner type
 * in the city (ADR-033). Falls back to no filter (undefined) for categories with no obvious match. */
const TYPE_BY_ALERT_TYPE: Record<string, string> = {
  BIKE_BREAKDOWN: "MECHANIC",
  FLAT_TYRE: "MECHANIC",
  BATTERY_ISSUE: "MECHANIC",
  FUEL_EMPTY: "FUEL_DELIVERY",
};

export function partnerTypeForAlertType(type: string): string | undefined {
  return TYPE_BY_ALERT_TYPE[type];
}
