import type { CurrentLegalDocumentsResponse, LegalDocumentTypeDTO } from "@bikie/types";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getJson } from "@/lib/api";
import { LegalContent } from "./LegalContent";

/** ADR-090 — a public legal page showing the *currently published* version of one document, the
 * same text signup asks users to accept (the admin dashboard is the only place it's edited). */
export async function LegalDocumentPage({ type, fallbackTitle }: { type: LegalDocumentTypeDTO; fallbackTitle: string }) {
  const current = await getJson<CurrentLegalDocumentsResponse>("/api/legal/current").catch(() => null);
  const doc = current?.documents.find((d) => d.type === type) ?? null;
  const title = doc?.title ?? fallbackTitle;

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        {doc ? (
          <>
            <p className="mt-2 text-sm text-foreground/50">
              Version {doc.version} · Effective{" "}
              {new Date(doc.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="mt-8">
              <LegalContent content={doc.content} />
            </div>
          </>
        ) : (
          <p className="mt-8 text-foreground/60">This document is temporarily unavailable. Please try again shortly.</p>
        )}
      </div>
    </div>
  );
}
