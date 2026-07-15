import { NextRequest, NextResponse } from "next/server";
import { DevOtpStore } from "@bikie/services";

/** Local-dev-only convenience — lets the login/signup UI show the OTP on screen instead of
 * requiring a terminal check, since no SMS vendor is configured yet (see ADR-013). Disabled
 * entirely in production; DevOtpStore itself is also a no-op there as a second guard. */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone query param" }, { status: 400 });
  }

  const code = await DevOtpStore.get(phone);
  return NextResponse.json({ code });
}
