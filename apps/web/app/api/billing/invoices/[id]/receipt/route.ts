import { BillingService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";
import { renderReceiptHtml } from "@/lib/receipt-html";

/**
 * `GET /api/billing/invoices/[id]/receipt` (ADR-070) — the same invoice as an inline, printable
 * HTML document ("Save as PDF" from the browser print dialog; opens fine inside a mobile
 * webview). Same ownership rule as the JSON route: a non-existent or someone-else's id is a
 * plain 404, never a redirect or an error that confirms existence.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) {
    // `requireSession` returns a JSON 401/403; for a document route a short text body is friendlier.
    return new Response("Sign in to view this receipt.", {
      status: error.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { id } = await params;
  const invoice = await BillingService.getInvoice(session.user.id, id);
  if (!invoice) {
    return new Response("Receipt not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(renderReceiptHtml(invoice), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoice.receiptNo}.html"`,
      "Cache-Control": "private, no-store",
    },
  });
}
