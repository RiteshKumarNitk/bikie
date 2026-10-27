import { prisma } from "../client";

const SETTINGS_ID = "singleton";

export interface SosNotificationSettingsDTO {
  pushEnabled: boolean;
  smsEnabled: boolean;
  updatedAt: Date;
  updatedByAdminId: string | null;
}

/** Always returns a row — upserts the singleton with its defaults (push + SMS both on) the first
 * time anything reads it, so a brand-new deployment behaves exactly as it always has until an
 * admin explicitly changes something. */
export async function getSettings(): Promise<SosNotificationSettingsDTO> {
  return prisma.sosNotificationSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });
}

export async function updateSettings(
  data: { pushEnabled?: boolean; smsEnabled?: boolean },
  adminId: string,
): Promise<SosNotificationSettingsDTO> {
  return prisma.sosNotificationSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data, updatedByAdminId: adminId },
    update: { ...data, updatedByAdminId: adminId },
  });
}
