import { afterEach, describe, expect, it, vi } from "vitest";

const { publicKeyId } = vi.hoisted(() => ({ publicKeyId: vi.fn<() => string | null>() }));
vi.mock("@bikie/services", () => ({ RazorpayService: { publicKeyId } }));

import { subscriptionCheckoutMode, subscriptionCheckoutPayload } from "./subscription-checkout";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("subscriptionCheckoutMode", () => {
  it("defaults to the existing hosted checkout when the switch isn't set", () => {
    publicKeyId.mockReturnValue("rzp_test_public");
    vi.stubEnv("RAZORPAY_SUBSCRIPTION_CHECKOUT_MODE", "");
    expect(subscriptionCheckoutMode()).toBe("hosted");
  });

  it("is native only when explicitly switched on AND Razorpay is configured", () => {
    vi.stubEnv("RAZORPAY_SUBSCRIPTION_CHECKOUT_MODE", "native");
    publicKeyId.mockReturnValue("rzp_test_public");
    expect(subscriptionCheckoutMode()).toBe("native");

    publicKeyId.mockReturnValue(null);
    expect(subscriptionCheckoutMode()).toBe("hosted");
  });

  it("treats any other value as hosted", () => {
    publicKeyId.mockReturnValue("rzp_test_public");
    vi.stubEnv("RAZORPAY_SUBSCRIPTION_CHECKOUT_MODE", "sdk");
    expect(subscriptionCheckoutMode()).toBe("hosted");
  });
});

describe("subscriptionCheckoutPayload", () => {
  it("keeps the existing fields and adds only the public key id, reuse flag and mode", () => {
    publicKeyId.mockReturnValue("rzp_test_public");
    vi.stubEnv("RAZORPAY_SUBSCRIPTION_CHECKOUT_MODE", "native");

    const payload = subscriptionCheckoutPayload({ id: "sub_1", status: "created", shortUrl: "https://rzp.io/i/1" }, true);

    expect(payload).toEqual({
      id: "sub_1",
      status: "created",
      shortUrl: "https://rzp.io/i/1",
      reused: true,
      keyId: "rzp_test_public",
      checkoutMode: "native",
    });
  });
});
