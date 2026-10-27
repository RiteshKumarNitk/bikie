-- CreateTable
CREATE TABLE "sos_notification_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "sos_notification_settings_pkey" PRIMARY KEY ("id")
);
