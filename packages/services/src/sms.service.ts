export const SMSService = {
  async send(to: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.log(`[SMS][DEV] To: ${to} | Message: ${message}`);
      return;
    }

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: message }),
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