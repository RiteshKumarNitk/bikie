export const SMSService = {
  async send(to: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    // Twilio's Messages API accepts either a dedicated `From` number or a `MessagingServiceSid`
    // (a pool of numbers/sender IDs) — never both. Messaging Service is preferred when set,
    // since that's how Twilio's own console quickstart provisions new accounts.
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || (!messagingServiceSid && !from)) {
      console.log(`[SMS][DEV] To: ${to} | Message: ${message}`);
      return;
    }

    const params: Record<string, string> = { To: to, Body: message };
    if (messagingServiceSid) params.MessagingServiceSid = messagingServiceSid;
    else params.From = from!;

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[SMS] Failed: ${body}`);
    }
  },

  async sendSOSAlert(phone: string, type: string, city: string) {
    await this.send(phone, `BIKIE SOS: ${type} alert in ${city}. Help is on the way.`);
  },
};