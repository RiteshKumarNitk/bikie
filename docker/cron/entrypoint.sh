#!/bin/sh
set -eu

# Fails fast at startup if the secret is missing, rather than every job silently 401ing
# forever with nothing surfacing it beyond a log line nobody's watching.
: "${CRON_SECRET:?CRON_SECRET must be set (same value as the web service's ./apps/.env)}"

# CRON_TARGET_URL (read by run-cron.sh, not used directly here) defaults to the `web`
# service's own internal address — compose's default network resolves service names, so
# "web" — not the public bikie.app domain. Reaching it this way never depends on
# DNS/reverse-proxy/TLS being up.
cat > /etc/crontabs/root <<'EOF'
* * * * * /usr/local/bin/run-cron.sh sos-escalate >> /proc/1/fd/1 2>&1
*/5 * * * * /usr/local/bin/run-cron.sh sos-resolve >> /proc/1/fd/1 2>&1
*/15 * * * * /usr/local/bin/run-cron.sh rider-location-cleanup >> /proc/1/fd/1 2>&1
EOF

echo "Cron schedule installed:"
cat /etc/crontabs/root

# -f: stay in foreground (this is the container's PID 1, so Docker can supervise/restart it).
# -l 2: log each job's start/exit, not just crond's own lifecycle.
# -L /dev/stdout: busybox crond logs via syslog() by default, which goes nowhere in a minimal
# container with no syslogd — explicitly targeting stdout is what actually makes these lines
# show up in `docker logs` (the job commands' own output already reaches stdout regardless,
# via each crontab line's `>> /proc/1/fd/1` redirect; this covers crond's own meta-logging too).
# Safe to log at this verbosity: the logged command line is just "run-cron.sh <name>", never
# the secret (see run-cron.sh's doc comment for why the curl call lives there, not inline here).
exec crond -f -l 2 -L /dev/stdout
