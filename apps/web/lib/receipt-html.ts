import type { InvoiceDetailDTO } from "@bikie/types";

/** ADR-070 — the printable receipt. A self-contained HTML document (inline CSS, one small
 * inline script for the Print button) rendered on demand from the stored, immutable invoice
 * snapshot — no PDF library, no stored file. "Save as PDF" from the browser's print dialog. */

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : `${esc(currency)} `;
  return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function date(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function renderReceiptHtml(inv: InvoiceDetailDTO): string {
  const accountLabel = inv.accountType === "SERVICE_PROVIDER" ? "Service Provider" : "Rider";
  const rows: Array<[string, string]> = [
    ["Receipt no.", esc(inv.receiptNo)],
    ["Status", inv.status === "PAID" ? "Paid" : "Refunded"],
    ["Billed to", esc(inv.customerName)],
    ...(inv.customerPhone ? [["Mobile", esc(inv.customerPhone)] as [string, string]] : []),
    ["Account type", accountLabel],
    ["Plan", esc(inv.planName)],
    ["Membership term", `${inv.durationDays} days`],
    ["Membership start", date(inv.membershipStartDate)],
    ["Membership expiry", date(inv.membershipEndDate)],
    ["Payment date", date(inv.paidAt)],
    ...(inv.razorpayPaymentId ? [["Razorpay payment ID", esc(inv.razorpayPaymentId)] as [string, string]] : []),
    ...(inv.razorpayOrderId ? [["Razorpay order ID", esc(inv.razorpayOrderId)] as [string, string]] : []),
  ];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(inv.receiptNo)} — BIKIE Membership Receipt</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f4f7; color: #1a1a2e; font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .sheet { max-width: 640px; margin: 32px auto; background: #fff; border: 1px solid #e5e5ef; border-radius: 16px; overflow: hidden; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding: 28px 32px; background: #26258F; color: #fff; }
  .head h1 { margin: 0; font-size: 20px; letter-spacing: .5px; }
  .head .sub { opacity: .85; font-size: 13px; margin-top: 2px; }
  .head .doc { text-align: right; font-size: 13px; opacity: .9; }
  .amount { padding: 24px 32px; border-bottom: 1px solid #eee; }
  .amount .label { font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: #6b6b80; }
  .amount .value { font-size: 32px; font-weight: 700; margin-top: 4px; }
  .amount .free { font-size: 13px; color: #6b6b80; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 11px 32px; border-bottom: 1px solid #f0f0f4; vertical-align: top; }
  td.k { color: #6b6b80; width: 42%; }
  td.v { text-align: right; font-weight: 500; word-break: break-word; }
  .foot { padding: 20px 32px 28px; font-size: 12px; color: #8a8a9a; }
  .btn { display: inline-block; margin: 0 32px 28px; padding: 10px 18px; background: #26258F; color: #fff; border: 0; border-radius: 10px; font-size: 14px; cursor: pointer; }
  @media print { body { background: #fff; } .sheet { border: 0; margin: 0; max-width: none; } .btn { display: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>BIKIE</h1>
        <div class="sub">Membership Receipt</div>
      </div>
      <div class="doc">
        <div>${esc(inv.receiptNo)}</div>
        <div>${date(inv.paidAt)}</div>
      </div>
    </div>
    <div class="amount">
      <div class="label">Amount ${inv.status === "PAID" ? "paid" : "refunded"}</div>
      <div class="value">${money(inv.amount, inv.currency)}</div>
      ${inv.amount === 0 ? '<div class="free">Free plan — no payment was collected.</div>' : ""}
    </div>
    <table>
      ${rows.map(([k, v]) => `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`).join("\n      ")}
    </table>
    <div class="foot">
      This is a system-generated receipt for a BIKIE membership purchase. Amount, plan and
      membership dates reflect the configuration in effect at the time of purchase and do not
      change if plan pricing is later updated. For help, contact BIKIE support.
    </div>
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;
}
