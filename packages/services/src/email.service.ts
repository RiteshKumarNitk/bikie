type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export const EmailService = {
  async send(payload: EmailPayload): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[EMAIL][DEV] To: ${payload.to} | Subject: ${payload.subject}`);
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "noreply@bikie.app",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[EMAIL] Failed: ${body}`);
    }
  },

  async sendBookingConfirmation(email: string, bikeName: string, startDate: string, endDate: string) {
    await this.send({
      to: email,
      subject: `Booking Confirmed – ${bikeName}`,
      html: `
        <h2>Booking Confirmed</h2>
        <p>Your booking for <strong>${bikeName}</strong> is confirmed.</p>
        <p>Start: ${startDate}<br/>End: ${endDate}</p>
      `,
    });
  },

  async sendSOSAlert(email: string, type: string, city: string) {
    await this.send({
      to: email,
      subject: `SOS Alert: ${type}`,
      html: `<h2>SOS Alert</h2><p>Type: ${type}</p><p>City: ${city}</p><p>Help is on the way.</p>`,
    });
  },
};