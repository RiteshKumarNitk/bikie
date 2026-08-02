import { NextRequest, NextResponse } from "next/server";
import { DevOtpStore } from "@bikie/services";

/**
 * Returns the OTP for login/signup toast UI during local/test builds only.
 * Requires explicit SHOW_OTP_TOAST=true and is always disabled in production.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.SHOW_OTP_TOAST !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone query param" }, { status: 400 });
  }

  const code = await DevOtpStore.get(phone);
  return NextResponse.json({ code });
}
