import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || (request.headers.get("authorization") ?? "") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await SOSService.autoResolveStaleAlerts(120);
  return NextResponse.json({ success: true });
}