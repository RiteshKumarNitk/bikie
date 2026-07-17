// Firebase Cloud Messaging background service worker. Static files can't read
// NEXT_PUBLIC_* env vars (only code Next actually builds gets them inlined), so this fetches
// its config from /api/firebase-config at load time instead of hardcoding it.
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

fetch("/api/firebase-config")
  .then((res) => res.json())
  .then((config) => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification ?? {};
      self.registration.showNotification(title ?? "BIKIE", {
        body: body ?? "",
        icon: "/favicon.ico",
        data: payload.data,
      });
    });
  })
  .catch((err) => console.error("[firebase-messaging-sw] config fetch failed", err));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.entity ? "/dashboard" : "/";
  event.waitUntil(self.clients.openWindow(url));
});
