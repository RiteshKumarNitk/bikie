import { pushSubscriptionRepository } from "@bikie/database";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { androidPriorityForNotificationType, channelIdForNotificationType } from "../domain/push-channel";
import type { PushMessage, PushPort } from "../ports";

let configured = false;

function ensureApp(): boolean {
  if (configured) return true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return false;

  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  configured = true;
  return true;
}

/** Firebase FCM adapter with DEV console fallback. */
export function createPushAdapter(): PushPort {
  return {
    async registerToken(input): Promise<void> {
      await pushSubscriptionRepository.upsertToken(input);
    },

    async unregisterToken(token: string): Promise<void> {
      await pushSubscriptionRepository.deleteToken(token);
    },

    async sendToUser(userId: string, payload: PushMessage): Promise<void> {
      if (!ensureApp()) {
        console.log(`[Push][DEV] To user ${userId}: ${payload.title} — ${payload.body}`);
        return;
      }

      const subscriptions = await pushSubscriptionRepository.findByUserId(userId);
      const tokens = subscriptions.map((s: { token: string }) => s.token);
      if (tokens.length === 0) return;

      // `android`/`webpush`/`apns` are per-platform override blocks — FCM applies only the
      // block matching each token's own registered platform, so one multicast call safely
      // covers a user's mixed web+Android devices. The channelId only matters for the
      // background/terminated case (the OS auto-displays `notification` there); the
      // foreground case is handled entirely client-side (`onMessage` + flutter_local_notifications
      // choosing the same channel from `data.type` — see `push-channel.ts`'s doc comment).
      const type = payload.data?.type ?? "SYSTEM";
      const res = await getMessaging().sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
        android: {
          priority: androidPriorityForNotificationType(type),
          notification: { channelId: channelIdForNotificationType(type) },
        },
      });

      await Promise.all(
        res.responses.map((r, i) => {
          if (
            !r.success &&
            (r.error?.code === "messaging/registration-token-not-registered" ||
              r.error?.code === "messaging/invalid-argument")
          ) {
            return pushSubscriptionRepository.deleteToken(tokens[i]);
          }
        }),
      );
    },
  };
}
