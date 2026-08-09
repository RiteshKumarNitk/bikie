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

/**
 * Whether a partner should ever be dispatched/see a given SOS category (ADR-044). Categories
 * with an obvious `PartnerType` (breakdown → MECHANIC, etc.) only reach partners of that exact
 * type. Categories with no obvious type (ACCIDENT/MEDICAL/LIFE_THREATENING/LOST/OTHER) only
 * reach partners who've explicitly opted in as a general responder — replaces the old
 * "broaden to every partner type if the strict search comes up empty" fallback in
 * escalation.application.ts, which is exactly why a fuel-delivery partner could receive a
 * medical emergency before this existed.
 */
export function partnerMatchesAlertType(
  partner: { type: string; isGeneralResponder: boolean },
  alertType: string,
): boolean {
  const relevantType = partnerTypeForAlertType(alertType);
  return relevantType ? partner.type === relevantType : partner.isGeneralResponder;
}
