import { describe, expect, it } from "vitest";
import { isAccountMuted } from "./domain/mute";

describe("mute policy", () => {
  const now = new Date("2026-08-02T00:00:00Z");

  it("treats MUTED without expiry as muted", () => {
    expect(isAccountMuted({ accountStatus: "MUTED", accountStatusExpiresAt: null, now })).toBe(true);
  });

  it("respects mute expiry", () => {
    expect(
      isAccountMuted({
        accountStatus: "MUTED",
        accountStatusExpiresAt: new Date("2026-07-01T00:00:00Z"),
        now,
      }),
    ).toBe(false);
    expect(
      isAccountMuted({
        accountStatus: "MUTED",
        accountStatusExpiresAt: new Date("2026-09-01T00:00:00Z"),
        now,
      }),
    ).toBe(true);
  });

  it("ignores non-muted statuses", () => {
    expect(isAccountMuted({ accountStatus: "ACTIVE", now })).toBe(false);
    expect(isAccountMuted({ accountStatus: "BANNED", now })).toBe(false);
  });
});
