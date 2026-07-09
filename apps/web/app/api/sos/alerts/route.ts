import { NextResponse } from "next/server";
import { SOSService, EmailService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";
import { broadcastEvent } from "@/lib/sse-manager";
import { prisma } from "@bikie/database";

export async function GET(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const url = new URL(request.url);
  const city = url.searchParams.get("city") || undefined;
  const alerts = await SOSService.getActiveAlerts(city);
  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const body = await request.json();
  const alert = await SOSService.createAlert(session.user.id, body);

  // Check profile completeness for SOS
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, name: true },
  });
  const missingFields: string[] = [];
  if (!user?.phone) missingFields.push("phone number");

  // Broadcast to all connected clients
  broadcastEvent("sos_alert", alert);

  // Notify user via email
  EmailService.sendSOSAlert(session.user.email, alert.type, alert.city).catch(console.error);

  return NextResponse.json({
    alert,
    profileWarning:
      missingFields.length > 0
        ? `Your profile is missing: ${missingFields.join(", ")}. Update your profile so responders can reach you.`
        : null,
  });
}