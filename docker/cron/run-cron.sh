#!/bin/sh
set -eu

# Kept as a separate script (not inline in the crontab) specifically so the secret never
# appears in the crontab file or in crond's own per-job execution log line (`crond -l 2`
# logs the command it ran verbatim) — only "/usr/local/bin/run-cron.sh <name>" does.
: "${CRON_SECRET:?CRON_SECRET must be set (same value as the web service's ./apps/.env)}"
: "${CRON_TARGET_URL:=http://web:3000}"

curl -fsS -m 30 -H "Authorization: Bearer ${CRON_SECRET}" "${CRON_TARGET_URL}/api/cron/$1"
