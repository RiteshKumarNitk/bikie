#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/database
npx prisma migrate deploy

cd /app

if [ "$SEED_DB" = "true" ]; then
  echo "Starting app for database seed..."
  pnpm --filter web start &
  APP_PID=$!

  echo "Waiting for app to be ready..."
  i=0
  while [ "$i" -lt 60 ]; do
    if curl -sf "http://127.0.0.1:${PORT:-3000}/" > /dev/null 2>&1; then
      break
    fi
    i=$((i + 1))
    sleep 2
  done

  echo "Seeding database..."
  pnpm db:seed || echo "Seed skipped or already applied."

  wait "$APP_PID"
else
  echo "Starting BIKIE web app..."
  exec "$@"
fi