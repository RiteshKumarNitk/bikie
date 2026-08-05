import { prisma } from "../client";
import type { PushPlatform } from "../generated/prisma/client";

export type UpsertTokenInput = {
  userId: string;
  token: string;
  platform?: PushPlatform;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
};

/** Upsert by the unique `token` — re-points `userId` in case the same device/browser is
 * later used by a different account (rare, but a real edge case worth handling explicitly
 * rather than erroring on the unique constraint). Re-upserting also flips
 * `notificationsEnabled` back to `true`, so a re-registered device (e.g. after reinstall)
 * isn't left silently muted by a stale prior disable. */
export async function upsertToken(input: UpsertTokenInput) {
  const { userId, token, platform, deviceId, deviceName, appVersion } = input;
  await prisma.pushSubscription.upsert({
    where: { token },
    create: {
      userId,
      token,
      platform: platform ?? "WEB",
      deviceId,
      deviceName,
      appVersion,
    },
    update: {
      userId,
      ...(platform ? { platform } : {}),
      ...(deviceId !== undefined ? { deviceId } : {}),
      ...(deviceName !== undefined ? { deviceName } : {}),
      ...(appVersion !== undefined ? { appVersion } : {}),
      notificationsEnabled: true,
    },
  });
}

export async function deleteToken(token: string) {
  await prisma.pushSubscription.deleteMany({ where: { token } });
}

export async function findByUserId(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId, notificationsEnabled: true },
    select: { token: true, platform: true },
  });
}
