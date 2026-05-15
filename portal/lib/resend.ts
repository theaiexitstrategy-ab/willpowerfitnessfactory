import { Resend } from 'resend';

const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@willpowerfitnessfactory.com';

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendWelcomeEmail(params: {
  to: string;
  businessName: string;
  storeUrl?: string;
}): Promise<void> {
  const resend = getClient();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping welcome email');
    return;
  }

  const html = `<!doctype html>
<html><body style="background:#0a0a0a;color:#f2f2f2;font-family:Arial,sans-serif;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #262626;padding:32px;">
    <h1 style="font-family:'Bebas Neue',Arial,sans-serif;font-size:34px;letter-spacing:0.04em;margin:0 0 8px;">WELCOME TO WILLPOWER MERCH.</h1>
    <p style="color:#C9A84C;letter-spacing:0.22em;font-size:11px;text-transform:uppercase;margin:0 0 24px;">${params.businessName}</p>
    <p>You're in. Your store builder is ready.</p>
    <p>Next: drop your logo, pick your products, set your prices. The whole onboarding takes about 5 minutes.</p>
    ${params.storeUrl ? `<p><a href="${params.storeUrl}" style="display:inline-block;background:#C9A84C;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;letter-spacing:0.22em;text-transform:uppercase;font-size:13px;">Open Your Portal →</a></p>` : ''}
    <p style="margin-top:32px;font-size:12px;color:#808080;">Questions? Just reply to this email.</p>
  </div>
</body></html>`;

  try {
    await resend.emails.send({
      from: `WillPower Merch <${fromEmail}>`,
      to: params.to,
      subject: 'Your merch store is ready to set up',
      html,
    });
  } catch (err) {
    console.error('[email] welcome send failed', err);
  }
}

export async function sendOrderNotification(params: {
  to: string;
  businessName: string;
  orderTotal: number;
  customerName: string;
}): Promise<void> {
  const resend = getClient();
  if (!resend) return;
  const total = `$${(params.orderTotal / 100).toFixed(2)}`;
  try {
    await resend.emails.send({
      from: `WillPower Merch <${fromEmail}>`,
      to: params.to,
      subject: `New order — ${total}`,
      html: `<p>${params.businessName} just got a new order.</p>
             <p><strong>${params.customerName}</strong> · ${total}</p>
             <p>Printify is fulfilling it now. Tracking will be added to your dashboard once it ships.</p>`,
    });
  } catch (err) {
    console.error('[email] order notification failed', err);
  }
}
