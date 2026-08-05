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
    type === "GROUP_JOIN_APPROVED"
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
