import { NextRequest, NextResponse } from "next/server";
import { DevOtpStore } from "@bikie/services";

/**
 * Returns the OTP code for a given phone number so the login/signup UI can display it as a toast.
 * Gated by SHOW_OTP_TOAST env var (defaults to enabled when not set to "false").
 */
export async function GET(req: NextRequest) {
  if (process.env.SHOW_OTP_TOAST === "false") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone query param" }, { status: 400 });
  }

  const code = await DevOtpStore.get(phone);
  return NextResponse.json({ code });
}
