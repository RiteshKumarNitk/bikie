import { describe, expect, it } from "vitest";
import {
  androidNotificationOverridesForType,
  androidPriorityForNotificationType,
  channelIdForNotificationType,
} from "./push-channel";

describe("push-channel", () => {
  describe("channelIdForNotificationType", () => {
    it("routes SOS to sos_channel", () => {
      expect(channelIdForNotificationType("SOS_ALERT")).toBe("sos_channel");
    });

    it("routes chat to chat_channel", () => {
      expect(channelIdForNotificationType("NEW_MESSAGE")).toBe("chat_channel");
    });

    it("routes ride-related types to ride_channel", () => {
      for (const type of [
        "RIDE_REQUEST_RECEIVED",
        "RIDE_REQUEST_APPROVED",
        "RIDE_REQUEST_REJECTED",
        "RIDE_ANNOUNCEMENT",
        "GROUP_JOIN_APPROVED",
        "TRIP_CANCELLED",
        "TRIP_RESCHEDULED",
      ]) {
        expect(channelIdForNotificationType(type)).toBe("ride_channel");
      }
    });

    it("falls back to general_channel for anything else, including SYSTEM", () => {
      expect(channelIdForNotificationType("SYSTEM")).toBe("general_channel");
      expect(channelIdForNotificationType("SOMETHING_UNKNOWN")).toBe("general_channel");
    });
  });

  describe("androidPriorityForNotificationType", () => {
    it("is high for SOS", () => {
      expect(androidPriorityForNotificationType("SOS_ALERT")).toBe("high");
    });

    it("is normal only for general_channel types", () => {
      expect(androidPriorityForNotificationType("SYSTEM")).toBe("normal");
    });
  });

  describe("androidNotificationOverridesForType", () => {
    it("gives SOS emergency-grade presentation", () => {
      expect(androidNotificationOverridesForType("SOS_ALERT")).toEqual({
        color: "#EF4444",
        visibility: "public",
        defaultSound: true,
        defaultVibrateTimings: true,
        priority: "max",
      });
    });

    it("leaves every non-SOS type untouched", () => {
      for (const type of ["NEW_MESSAGE", "RIDE_REQUEST_RECEIVED", "SYSTEM", "ANYTHING_ELSE"]) {
        expect(androidNotificationOverridesForType(type)).toEqual({});
      }
    });
  });
});
