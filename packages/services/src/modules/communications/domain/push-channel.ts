/**
 * Maps a `NotificationType` to the Android notification channel it should render in.
 * Set server-side on the FCM `android.notification.channelId` field so a
 * background/terminated tap (auto-displayed by the OS, no app code involved) lands in the
 * right channel — not just the default one. The Flutter app defines these same channel ids
 * locally (`AndroidNotificationChannel`, `push_channels.dart`) for the foreground case, where
 * the app itself decides how to display the message. The two can't share code (different
 * languages/runtimes) so keep this mapping in sync with that file if either changes.
 */
export function channelIdForNotificationType(type: string): string {
  if (type === "SOS_ALERT") return "sos_channel";
  if (type === "NEW_MESSAGE") return "chat_channel";
  if (
    type === "RIDE_REQUEST_RECEIVED" ||
    type === "RIDE_REQUEST_APPROVED" ||
    type === "RIDE_REQUEST_REJECTED" ||
    type === "RIDE_ANNOUNCEMENT" ||
    type === "GROUP_JOIN_APPROVED" ||
    type === "TRIP_CANCELLED" ||
    type === "TRIP_RESCHEDULED"
  ) {
    return "ride_channel";
  }
  return "general_channel";
}

/** SOS/ride/chat are time-sensitive enough to wake a doze-mode device; system/moderation
 * notices are not. */
export function androidPriorityForNotificationType(type: string): "high" | "normal" {
  return channelIdForNotificationType(type) === "general_channel" ? "normal" : "high";
}

/**
 * Extra `android.notification` fields for the background/terminated case (the OS draws these
 * directly from the FCM payload — the foreground case sets the Flutter-side equivalents itself,
 * see `push_bootstrap.dart`'s `buildAndroidNotificationDetails`). Only `SOS_ALERT` gets
 * emergency-grade presentation; every other type returns `{}` and renders exactly as before —
 * deliberately not "the whole app is high priority now."
 *
 * `sos_channel` itself already has `Importance.max` + sound + vibration (`push_channels.dart`),
 * which is what actually drives heads-up/sound/vibration on Android 8+ — these fields are a
 * belt-and-suspenders layer for pre-channel behavior and visual distinction (red tint, visible
 * on the lock screen) that the channel alone doesn't cover.
 */
export function androidNotificationOverridesForType(type: string): {
  color?: string;
  visibility?: "private" | "public" | "secret";
  defaultSound?: boolean;
  defaultVibrateTimings?: boolean;
  priority?: "min" | "low" | "default" | "high" | "max";
} {
  if (type !== "SOS_ALERT") return {};
  return {
    color: "#EF4444",
    visibility: "public",
    defaultSound: true,
    defaultVibrateTimings: true,
    priority: "max",
  };
}
