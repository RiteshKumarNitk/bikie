"use client";

import { useCallback, useEffect } from "react";

/**
 * MSG91 Widget SDK (ADR-034) — web's OTP authority. Loaded with `exposeMethods: true`, which
 * suppresses the widget's own popup UI and instead exposes `window.sendOtp`/`retryOtp`/`verifyOtp`
 * so our existing PhoneNumberInput/OTP form (unchanged) drives the widget instead of MSG91's own
 * UI. The widget itself talks to MSG91 directly from the browser — our backend never sees the
 * send/verify legs, only the final access token (see `verifyOtp` below), which is re-verified
 * server-side via `authClient.phoneNumber.verify` before any session is issued.
 */

type WidgetResult = { message: string; type: "success" | "error" };

/** ADR-057 — the two delivery channels exposed to the user (Voice/Email exist on MSG91's side
 * too, but aren't offered in this app's UI). */
export type OtpChannel = "sms" | "whatsapp";

/** MSG91 JS widget's `retryOtp` channel codes — confirmed against MSG91's public docs during
 * ADR-057 (docs.msg91.com/otp-widget's resend reference: 'SMS-11' / 'VOICE-4' / 'EMAIL-3' /
 * 'WHATSAPP-12'). The previous value here was the untested string `"text"`, carried over from
 * this file's original implementation before the exact codes could be confirmed — replaced now
 * that they have been, but still worth a real end-to-end test against a live widget before
 * relying on it (this file talks to MSG91 directly from the browser; nothing here is unit-testable). */
const RETRY_CHANNEL_CODE: Record<OtpChannel, string> = {
  sms: "SMS-11",
  whatsapp: "WHATSAPP-12",
};

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
    sendOtp?: (
      identifier: string,
      success?: (data: WidgetResult) => void,
      failure?: (err: WidgetResult) => void,
    ) => void;
    retryOtp?: (
      channel: string,
      success?: (data: WidgetResult) => void,
      failure?: (err: WidgetResult) => void,
    ) => void;
    verifyOtp?: (
      otp: string,
      success?: (data: WidgetResult) => void,
      failure?: (err: WidgetResult) => void,
    ) => void;
  }
}

// MSG91's widget script has no official fallback-CDN mechanism of its own — verify.msg91.com is
// the primary host, verify.phone91.com a documented alternate. Tried in order, second only on
// load failure of the first.
const SCRIPT_URLS = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];

let widgetReady: Promise<void> | null = null;

function loadWidget(): Promise<void> {
  if (widgetReady) return widgetReady;

  widgetReady = new Promise((resolve, reject) => {
    let attemptIndex = 0;

    function attempt() {
      const script = document.createElement("script");
      script.src = SCRIPT_URLS[attemptIndex];
      script.async = true;
      script.onload = () => {
        if (typeof window.initSendOTP !== "function") {
          reject(new Error("MSG91 widget script loaded but initSendOTP is missing"));
          return;
        }
        window.initSendOTP({
          widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID,
          tokenAuth: process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH,
          exposeMethods: true,
          // Only reached if a call site invokes the widget's own popup UI, which this app never
          // does (exposeMethods: true routes success/failure into per-call callbacks instead) —
          // required fields of the config, kept as no-ops.
          success: () => {},
          failure: () => {},
        });
        resolve();
      };
      script.onerror = () => {
        attemptIndex += 1;
        if (attemptIndex < SCRIPT_URLS.length) attempt();
        else reject(new Error("Failed to load the MSG91 widget script"));
      };
      document.head.appendChild(script);
    }

    attempt();
  });

  return widgetReady;
}

function callWidgetMethod(method: (success: (d: WidgetResult) => void, failure: (e: WidgetResult) => void) => void) {
  return new Promise<WidgetResult>((resolve, reject) => {
    method(
      (data) => resolve(data),
      (err) => reject(new Error(err?.message || "MSG91 request failed")),
    );
  });
}

export function useMsg91Widget() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || !process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH) return;
    loadWidget().catch((err) => console.error("[MSG91 widget]", err));
  }, []);

  /**
   * ADR-057 — `channel` defaults to `"sms"`. MSG91's widget has no channel parameter on the
   * *initial* send at all (`initSendOTP`'s `sendOtp(identifier, success, failure)` — confirmed
   * against MSG91's public docs, no third argument exists for this call); the account's
   * configured default channel is whatever fires. So `channel: "whatsapp"` here means: let the
   * default send go out, then immediately fire a `retryOtp("WHATSAPP-12", ...)` right behind it
   * so the OTP the user actually reads arrives on WhatsApp. This is a real, documented MSG91
   * limitation, not a workaround invented here — flagged in ADR-057. Concretely: if the account's
   * default channel is SMS, picking WhatsApp on the first send means the phone receives BOTH an
   * SMS and a WhatsApp message with the same code (and MSG91 bills for both) — there is no way to
   * suppress the first one from this widget API. The `success`/`failure` callbacks/return value
   * always reflect the *last* channel attempted (the one the user actually asked for).
   */
  const sendOtp = useCallback(async (phoneNumber: string, channel: OtpChannel = "sms") => {
    await loadWidget();
    if (typeof window.sendOtp !== "function") throw new Error("MSG91 widget not ready");
    const sendResult = await callWidgetMethod((success, failure) => window.sendOtp!(phoneNumber, success, failure));
    if (channel === "sms") return sendResult;

    if (typeof window.retryOtp !== "function") throw new Error("MSG91 widget not ready");
    return callWidgetMethod((success, failure) => window.retryOtp!(RETRY_CHANNEL_CODE[channel], success, failure));
  }, []);

  const retryOtp = useCallback(async (channel: OtpChannel = "sms") => {
    await loadWidget();
    if (typeof window.retryOtp !== "function") throw new Error("MSG91 widget not ready");
    return callWidgetMethod((success, failure) => window.retryOtp!(RETRY_CHANNEL_CODE[channel], success, failure));
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    await loadWidget();
    if (typeof window.verifyOtp !== "function") throw new Error("MSG91 widget not ready");
    return callWidgetMethod((success, failure) => window.verifyOtp!(code, success, failure));
  }, []);

  return { sendOtp, retryOtp, verifyOtp };
}
