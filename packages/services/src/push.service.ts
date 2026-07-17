import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { pushSubscriptionRepository } from "@bikie/database";

let configured = false;

/** Lazily initializes the Firebase Admin SDK from env vars — dev-safe fallback matching
 * SMSService: if any of the three are unset, callers log instead of sending. */
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

export const PushService = {
  async registerToken(userId: string, token: string): Promise<void> {
    await pushSubscriptionRepository.upsertToken(userId, token);
  },

  async unregisterToken(token: string): Promise<void> {
    await pushSubscriptionRepository.deleteToken(token);
  },

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    if (!ensureApp()) {
      console.log(`[Push][DEV] To user ${userId}: ${payload.title} — ${payload.body}`);
      return;
    }

    const subscriptions = await pushSubscriptionRepository.findByUserId(userId);
    const tokens = subscriptions.map((s) => s.token);
    if (tokens.length === 0) return;

    const res = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
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
