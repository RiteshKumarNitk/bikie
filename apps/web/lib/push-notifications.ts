"use client";

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
}

let cachedConfig: FirebaseConfig | null = null;

async function loadConfig(): Promise<FirebaseConfig> {
  if (cachedConfig) return cachedConfig;
  const res = await fetch("/api/firebase-config");
  cachedConfig = await res.json();
  return cachedConfig!;
}

/**
 * Requests Notification permission, registers the service worker, and returns an FCM token —
 * or null if the browser doesn't support push (Safari's support is version-gated) or the user
 * declines. Callers should show a friendly fallback rather than treating null as an error.
 */
export async function enablePushNotifications(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  try {
    if (!(await isSupported())) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const config = await loadConfig();
    if (!config.apiKey) return null; // Firebase not configured server-side yet

    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    return token || null;
  } catch (err) {
    console.error("Push notification setup failed", err);
    return null;
  }
}
