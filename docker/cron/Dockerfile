# syntax=docker/dockerfile:1

# Minimal cron runner for the app's three `GET /api/cron/*` tickers (sos-escalate,
# sos-resolve, rider-location-cleanup) — see .docs/TASKS.md: these were fully implemented
# but nothing was ever actually scheduling them (no Vercel Cron here — this app deploys to
# a VPS via docker-compose, not Vercel; vercel.json at the repo root is unused leftover
# config). Alpine's built-in busybox `crond` + `curl` is enough for three periodic HTTP
# calls; no need for a heavier scheduler.
FROM alpine:3.20
RUN apk add --no-cache curl

COPY entrypoint.sh /entrypoint.sh
COPY run-cron.sh /usr/local/bin/run-cron.sh
RUN chmod +x /entrypoint.sh /usr/local/bin/run-cron.sh

ENTRYPOINT ["/entrypoint.sh"]
