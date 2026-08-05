Now, the SOS notification flow — who gets notified, who responds, who gets notified back
When you tap SOS on Home → confirm on /sos → it fires POST /api/sos/alerts, which runs two things in parallel:

1. Immediate, always-fire recipients:

Your saved emergency contacts (up to 3, from the profile form) — SMS + WhatsApp + email, whichever they have on file
The optional platform-wide SOS_EMERGENCY_SERVICES_PHONE/EMAIL (if configured)
You get an in-app confirmation ("Your SOS alert is live, alerting N responders in [city]")
2. Nearby riders (tier 1, ~5km radius):

Any rider with location-sharing on within range gets notified (in-app + SMS/WhatsApp), with your distance and a navigate link
If any of them share a Group/community with you, they're prioritized with a shorter timeout before falling through to the general pool
If literally nobody is reached (no contacts, no nearby riders, no configured emergency-services number) → it escalates immediately to up to 5 admins, and you're told to call emergency services directly rather than shown a false "sent" message.

If nobody responds in time, a cron job (sos-escalate, ~1/min) widens the radius in steps, then advances tiers: nearby riders → verified service providers (mechanics etc., city-matched) → admins (terminal).

Who can respond: anyone who received the alert taps "I'm Coming" — that's an offer, not an assignment. You (the reporter, or an admin) see the list of offers with distance/ETA and tap Accept on one. That's the actual assignment (transactional — only one offer can win, everyone else's offer is auto-closed).

After that, notifications flow between the two of you specifically:

Accepted → the helper gets "You're confirmed"
Helper marks "Arrived" → you get notified
Helper marks "Assistance in progress" → you get notified
You mark "Complete" → the helper gets notified
Either of you cancels → the other gets notified
Alert resolved/closed → whichever of you didn't resolve it gets notified (this one I added recently — it used to be silent)
You also get a live chat + call/navigate buttons with your assigned helper once matched, and can share a nearby verified mechanic/fuel contact from the session screen.

One thing worth being upfront about: all of this only becomes a real push notification on Android once the pending DB migration is applied and google-services.json is added (from the earlier FCM work) — until then it still works, but only shows up in the in-app Notifications feed while the app happens to be open, not as a phone-buzzing alert.