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

  const sendOtp = useCallback(async (phoneNumber: string) => {
    await loadWidget();
    if (typeof window.sendOtp !== "function") throw new Error("MSG91 widget not ready");
    return callWidgetMethod((success, failure) => window.sendOtp!(phoneNumber, success, failure));
  }, []);

  const retryOtp = useCallback(async () => {
    await loadWidget();
    if (typeof window.retryOtp !== "function") throw new Error("MSG91 widget not ready");
    // Explicit 'text' channel — MSG91's own default for this call is a voice call, not SMS.
    return callWidgetMethod((success, failure) => window.retryOtp!("text", success, failure));
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    await loadWidget();
    if (typeof window.verifyOtp !== "function") throw new Error("MSG91 widget not ready");
    return callWidgetMethod((success, failure) => window.verifyOtp!(code, success, failure));
  }, []);

  return { sendOtp, retryOtp, verifyOtp };
}
