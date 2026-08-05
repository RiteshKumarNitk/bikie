-- Android FCM push (ADR-035). Additive only — existing WEB push_subscription rows keep
-- working unchanged (platform defaults to WEB, the other new columns default to NULL/true).

-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('WEB', 'ANDROID', 'IOS');

-- AlterTable
ALTER TABLE "push_subscription"
  ADD COLUMN "platform" "PushPlatform" NOT NULL DEFAULT 'WEB',
  ADD COLUMN "deviceId" TEXT,
  ADD COLUMN "deviceName" TEXT,
  ADD COLUMN "appVersion" TEXT,
  ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
