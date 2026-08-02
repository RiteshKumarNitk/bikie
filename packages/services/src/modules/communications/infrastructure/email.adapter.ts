import nodemailer, { type Transporter } from "nodemailer";
import type { ChannelResult, EmailMessage, EmailPort } from "../ports";
import { fetchWithTimeout } from "./http";

let cachedTransport: Transporter | null = null;

function smtpConfig() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: (process.env.SMTP_SECURE?.trim() || "").toLowerCase() === "true" || port === 465,
    auth: { user, pass },
  };
}

function getTransport(): Transporter | null {
  const config = smtpConfig();
  if (!config) return null;
  if (!cachedTransport) cachedTransport = nodemailer.createTransport(config);
  return cachedTransport;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || "noreply@bikie.app";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** SMTP primary, Resend fallback, then DEV log — same selection order as legacy EmailService. */
export function createEmailAdapter(): EmailPort {
  return {
    isConfigured() {
      return smtpConfig() !== null || Boolean(process.env.RESEND_API_KEY?.trim());
    },

    async send(payload: EmailMessage): Promise<ChannelResult> {
      const transport = getTransport();

      if (transport) {
        try {
          const info = await transport.sendMail({
            from: fromAddress(),
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text ?? stripHtml(payload.html),
          });
          console.log(`[EMAIL][SMTP] Sent to ${payload.to} | id=${info.messageId}`);
          return { ok: true, provider: "smtp" };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[EMAIL][SMTP] Failed to ${payload.to}: ${message}`);
          return { ok: false, provider: "smtp", error: message };
        }
      }

      if (process.env.RESEND_API_KEY) {
        const res = await fetchWithTimeout("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress(),
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          console.error(`[EMAIL][RESEND] Failed to ${payload.to}: ${body}`);
          return { ok: false, provider: "resend", error: body };
        }
        console.log(`[EMAIL][RESEND] Sent to ${payload.to}`);
        return { ok: true, provider: "resend" };
      }

      console.log(`[EMAIL][DEV] To: ${payload.to} | Subject: ${payload.subject}`);
      return {
        ok: false,
        provider: "dev",
        error: "No SMTP_USER/SMTP_PASS or RESEND_API_KEY configured",
      };
    },
  };
}
