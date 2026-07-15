import { NextResponse } from "next/server";
import { SOSService, EmailService, RealtimeService } from "@bikie/services";
import { sosAlertCreateSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@bikie/database";

export async function GET(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const url = new URL(request.url);
  const city = url.searchParams.get("city") || undefined;

  // Admins monitor the whole network and are allowed to see every city (the admin SOS page
  // says so explicitly); everyone else only sees alerts — including reporter name/phone/email
  // and exact GPS — from riders in the same city. Enforced server-side rather than left to the
  // client to opt into, since a member could otherwise just omit the filter to see every city.
  if (session.user.role !== "ADMIN" && !city) {
    return NextResponse.json(
      { error: "CITY_REQUIRED", message: "Share your city to see nearby SOS alerts." },
      { status: 400 },
    );
  }

  const alerts = await SOSService.getActiveAlerts(city);
  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  // SOS alerts fan out to every connected client + an email send — cap how often one
  // account can trigger that (real emergencies are rare; 5 per 5 minutes is generous
  // headroom over a genuine false-alarm-then-correction flow while blocking spam/abuse).
  const rateLimitError = await enforceRateLimit("sos-alert-create", session.user.id, {
    requests: 5,
    windowSeconds: 300,
  });
  if (rateLimitError) return rateLimitError;

  const parsed = sosAlertCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const alert = await SOSService.createAlert(session.user.id, parsed.data);

  // Check profile completeness for SOS
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, name: true },
  });
  const missingFields: string[] = [];
  if (!user?.phone) missingFields.push("phone number");

  // Broadcast to all connected clients
  await RealtimeService.publishGlobal("sos_alert", alert);

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