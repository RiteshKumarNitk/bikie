import type { LegalDocumentTypeDTO, LegalVersionStatusDTO } from "@bikie/types";

export const LEGAL_TYPE_LABEL: Record<LegalDocumentTypeDTO, string> = {
  TERMS_AND_CONDITIONS: "Terms & Conditions",
  PRIVACY_POLICY: "Privacy Policy",
  USER_AGREEMENT: "User Agreement",
};

export const LEGAL_STATUS_STYLE: Record<LegalVersionStatusDTO, string> = {
  DRAFT: "bg-amber-500/15 text-amber-300",
  PUBLISHED: "bg-emerald-500/15 text-emerald-300",
  ARCHIVED: "bg-white/10 text-white/60",
};

export function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export function fmtDateTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export function StatusPill({ status }: { status: LegalVersionStatusDTO }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${LEGAL_STATUS_STYLE[status]}`}>{status}</span>;
}
