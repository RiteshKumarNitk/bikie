import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const smsSend = vi.fn(
  async (_to: string, _message: string, _templateId?: string, _label?: string) => ({
    ok: true,
    provider: "msg91" as const,
  }),
);
vi.mock("./modules/communications/public", () => ({
  getCommunicationsPorts: () => ({ sms: { send: smsSend } }),
}));

import {
  SMSService,
  resolveSmsTemplateId,
  buildMembershipSubscribedBody,
  buildPartnerMembershipSubscribedBody,
} from "./sms.service";

describe("SMSService — one DLT template per SMS type (ADR-058)", () => {
  beforeEach(() => {
    smsSend.mockClear();
    vi.unstubAllEnvs();
  });
  afterEach(() => vi.unstubAllEnvs());

  describe("resolveSmsTemplateId", () => {
    it("returns the id when the env var is set", () => {
      vi.stubEnv("MY_TEMPLATE", "tmpl_123");
      expect(resolveSmsTemplateId("MY_TEMPLATE", "x")).toBe("tmpl_123");
    });

    it("returns null and logs a config error naming the var when unset", () => {
      const err = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("MY_TEMPLATE", "");
      expect(resolveSmsTemplateId("MY_TEMPLATE", "membership-subscribed")).toBeNull();
      expect(err).toHaveBeenCalledWith(expect.stringContaining("MY_TEMPLATE is not set"));
      err.mockRestore();
    });
  });

  describe("sendMembershipSubscribed", () => {
    it("REFUSES to send (no MSG91 call) when MSG91_MEMBERSHIP_SUB_TEMPLATE_ID is unset", async () => {
      const err = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("MSG91_MEMBERSHIP_SUB_TEMPLATE_ID", "");

      const res = await SMSService.sendMembershipSubscribed("+919000000001", "Priya", new Date("2027-01-01"));

      expect(res.ok).toBe(false);
      expect(res.provider).toBe("unconfigured");
      expect(smsSend).not.toHaveBeenCalled();
      err.mockRestore();
    });

    it("sends with the configured template id when set", async () => {
      vi.stubEnv("MSG91_MEMBERSHIP_SUB_TEMPLATE_ID", "bikie_sub_tmpl");

      await SMSService.sendMembershipSubscribed("+919000000001", "Priya", new Date("2027-01-01"));

      expect(smsSend).toHaveBeenCalledTimes(1);
      const [phone, message, templateId, label] = smsSend.mock.calls[0]!;
      expect(phone).toBe("+919000000001");
      expect(templateId).toBe("bikie_sub_tmpl");
      expect(label).toBe("membership-subscribed");
      expect(message).toContain("Priya");
    });
  });

  describe("sendPartnerMembershipSubscribed (ADR-080)", () => {
    it("REFUSES to send when MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID is unset, even if the text is configured", async () => {
      vi.stubEnv("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID", "");
      vi.stubEnv("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT", "Hello SP {name}, renews {renewalDate}");
      const err = vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await SMSService.sendPartnerMembershipSubscribed("+919000000002", "Auto Care", new Date("2027-01-01"));

      expect(res).toEqual({
        ok: false,
        provider: "unconfigured",
        error: "MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID / MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT not configured",
      });
      expect(smsSend).not.toHaveBeenCalled();
      err.mockRestore();
    });

    it("REFUSES to send when the template id is set but the approved text is not (never invents wording)", async () => {
      vi.stubEnv("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID", "sp-tmpl-id");
      vi.stubEnv("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT", "");
      const err = vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await SMSService.sendPartnerMembershipSubscribed("+919000000002", "Auto Care", new Date("2027-01-01"));

      expect(res.ok).toBe(false);
      expect(res.provider).toBe("unconfigured");
      expect(smsSend).not.toHaveBeenCalled();
      expect(err).toHaveBeenCalledWith(expect.stringContaining("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT is not set"));
      err.mockRestore();
    });

    it("never falls back to the Rider MSG91_MEMBERSHIP_SUB_TEMPLATE_ID", async () => {
      vi.stubEnv("MSG91_MEMBERSHIP_SUB_TEMPLATE_ID", "rider-annual-tmpl");
      vi.stubEnv("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID", "");
      vi.stubEnv("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT", "Hello SP {name}, renews {renewalDate}");
      const err = vi.spyOn(console, "error").mockImplementation(() => {});

      await SMSService.sendPartnerMembershipSubscribed("+919000000002", "Auto Care", new Date("2027-01-01"));

      expect(smsSend).not.toHaveBeenCalled();
      err.mockRestore();
    });

    it("sends with the operator-configured template id + text once both are set", async () => {
      vi.stubEnv("MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID", "sp-tmpl-id");
      vi.stubEnv(
        "MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT",
        "Hello Service Provider {name}, your BIKIE monthly membership renews on {renewalDate}.",
      );

      await SMSService.sendPartnerMembershipSubscribed("+919000000002", "Auto Care", new Date("2027-03-15T00:00:00Z"));

      expect(smsSend).toHaveBeenCalledTimes(1);
      const [phone, message, templateId, label] = smsSend.mock.calls[0]!;
      expect(phone).toBe("+919000000002");
      expect(templateId).toBe("sp-tmpl-id");
      expect(label).toBe("partner-membership-subscribed");
      expect(message).toBe("Hello Service Provider Auto Care, your BIKIE monthly membership renews on 15-Mar-2027.");
    });
  });

  it("buildPartnerMembershipSubscribedBody substitutes {name}/{renewalDate} into the operator-supplied text, verbatim otherwise", () => {
    const body = buildPartnerMembershipSubscribedBody(
      "Auto Care",
      new Date("2027-03-15T00:00:00Z"),
      "Hi {name}, your SP plan renews {renewalDate}. Thanks!",
    );
    expect(body).toBe("Hi Auto Care, your SP plan renews 15-Mar-2027. Thanks!");
  });

  it("admin manual send() is not a DLT product template — sends with NO template id, never borrows MSG91_TEMPLATE_ID", async () => {
    vi.stubEnv("MSG91_TEMPLATE_ID", "should-not-be-used");
    await SMSService.send("+919000000001", "hello");
    expect(smsSend.mock.calls[0]![2]).toBeUndefined();
    expect(smsSend.mock.calls[0]![3]).toBe("admin-manual");
  });

  it("buildMembershipSubscribedBody fills the two variable slots", () => {
    const body = buildMembershipSubscribedBody("Priya", new Date("2027-03-15T00:00:00Z"));
    expect(body).toContain("Priya");
    expect(body).toMatch(/\d{2}-\w{3}-2027/);
  });

  it("buildMembershipSubscribedBody matches the registered DLT template's fixed text exactly (only the two ##alphanumeric## slots vary)", () => {
    const body = buildMembershipSubscribedBody("Rahul Kumar", new Date("2027-10-09T00:00:00Z"));
    expect(body).toBe(
      "Hello Rider Rahul Kumar; Welcome to BIKIE Community, You are successfully subscribed for " +
        "BIKIE annual Membership, your membership will be renewed on 09-Oct-2027 as Noted by KSHIDL",
    );
  });
});
