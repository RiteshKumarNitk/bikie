import { NextResponse } from "next/server";
import { SOSService, SOSDispatchService, RealtimeService } from "@bikie/services";
import { sosAlertCreateSchema, sosActiveAlertsQuerySchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

// ADR-042: GPS radius around the viewer, not a same-city text match — matches the radius used
// for GET /api/partners/nearby.
const ALERT_VISIBILITY_RADIUS_METERS = 25_000;

// Service Providers get their own eligibility-filtered feed (`GET /api/partner/sos/nearby`) —
// this generic browse/create surface is Rider (+ Admin monitoring) only. Belt-and-suspenders
// alongside the UI-level separation (Partner dashboard never links here): without this, a
// Partner account could still create/browse the Rider SOS feed by calling the API directly.
function forbidPartner(session: { user: { role: string } }) {
  if (session.user.role === "PARTNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;
  const partnerError = forbidPartner(session);
  if (partnerError) return partnerError;

  const url = new URL(request.url);
  const parsed = sosActiveAlertsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { lat, lng } = parsed.data;

  // Admins monitor the whole network and are allowed to see every alert (the admin SOS page
  // says so explicitly); everyone else only sees alerts — including reporter name/phone/email
  // and exact GPS — within range of their own current location. Enforced server-side rather
  // than left to the client to opt into, since a member could otherwise just omit the filter to
  // see every alert network-wide.
  if (session.user.role !== "ADMIN" && (lat === undefined || lng === undefined)) {
    return NextResponse.json(
      { error: "LOCATION_REQUIRED", message: "Share your location to see nearby SOS alerts." },
      { status: 400 },
    );
  }

  const location = lat !== undefined && lng !== undefined
    ? { latitude: lat, longitude: lng, radiusMeters: ALERT_VISIBILITY_RADIUS_METERS }
    : undefined;
  // ADR-045 — each returned alert is redacted (phone/email/exact location nulled) unless this
  // viewer is its reporter, its assigned helper, or an admin.
  const alerts = await SOSService.getActiveAlerts(location, {
    userId: session.user.id,
    isAdmin: session.user.role === "ADMIN",
  });
  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;
  const partnerError = forbidPartner(session);
  if (partnerError) return partnerError;

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
