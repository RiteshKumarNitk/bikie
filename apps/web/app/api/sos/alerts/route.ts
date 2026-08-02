import { NextResponse } from "next/server";
import { SOSService, SOSDispatchService, RealtimeService } from "@bikie/services";
import { sosAlertCreateSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

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

  // SOS alerts fan out to every connected client + SMS/WhatsApp/email — cap how often one
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
  const profileWarning = await SOSService.getProfileWarning(session.user.id);

  // Broadcast to all connected clients (admin live feed + SSE subscribers)
  await RealtimeService.publishGlobal("sos_alert", alert);

  // Fan-out: SMS + WhatsApp + email (+ in-app/push) to nearby riders, same-city service
  // providers, the reporter's emergency contacts, and optional emergency-services numbers.
  // Degrades to [SMS|WHATSAPP|EMAIL][DEV] console logs when live credentials are unset.
  const dispatch = await SOSDispatchService.fanOut(alert).catch((err) => {
    console.error("[SOS][DISPATCH] failed", err);
    return null;
  });

  return NextResponse.json({
    alert,
    dispatch,
    profileWarning,
  });
}
