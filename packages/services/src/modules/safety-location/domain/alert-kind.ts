/** Derive alert severity label from the description prefix written by the Panic UI. */
export function alertKind(description: string | null): "RED" | "AMBER" | "SOS" {
  if (description?.startsWith("Red Alert")) return "RED";
  if (description?.startsWith("Amber Alert")) return "AMBER";
  return "SOS";
}
