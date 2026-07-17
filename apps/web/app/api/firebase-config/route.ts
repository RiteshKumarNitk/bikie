import { NextResponse } from "next/server";

// Firebase's client config (apiKey/projectId/messagingSenderId/appId) is not secret — it
// identifies the project, it doesn't authenticate anything — but the static service worker
// (public/firebase-messaging-sw.js) can't read NEXT_PUBLIC_* env vars at all (only code Next
// actually builds gets them inlined), so it fetches this route once at load time instead.
export async function GET() {
  return NextResponse.json({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  });
}
