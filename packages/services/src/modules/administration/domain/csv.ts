/** Hard cap for admin CSV downloads — prevents unbounded memory/response size. */
export const MAX_ADMIN_CSV_ROWS = 10_000;

const DANGEROUS_LEADING_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/** Prefix a leading quote when a cell would be interpreted as a spreadsheet formula. */
export function sanitizeCsvCell(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  return str.length > 0 && DANGEROUS_LEADING_CHARS.has(str[0]) ? `'${str}` : str;
}

function escapeCsvCell(value: unknown): string {
  return `"${sanitizeCsvCell(value).replace(/"/g, '""')}"`;
}

/** Build a CSV document from row objects. Empty input yields a blank document (header-less). */
export function buildCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const header = Object.keys(rows[0]!).map(escapeCsvCell).join(",");
  const lines = rows.map((row) => Object.values(row).map(escapeCsvCell).join(","));
  return [header, ...lines].join("\n");
}

export type AdminExportType = "users" | "bookings" | "partners";

export function exportFilenameFor(type: AdminExportType): string {
  return `${type}.csv`;
}
