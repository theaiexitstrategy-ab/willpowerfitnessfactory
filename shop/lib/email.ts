import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'orders@willpowerfitnessfactory.com';

export async function sendOrderConfirmation(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  totalCents: number;
  items: { name: string; size: string; color: string; quantity: number }[];
}): Promise<void> {
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping confirmation email');
    return;
  }

  const resend = new Resend(apiKey);
  const total = `$${(params.totalCents / 100).toFixed(2)}`;
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #262626;">${i.quantity}× ${i.name} — ${i.color}, ${i.size}</td></tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html><body style="background:#0a0a0a;color:#f2f2f2;font-family:Arial,sans-serif;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #262626;padding:32px;">
    <h1 style="font-family:'Bebas Neue',Arial,sans-serif;font-size:36px;letter-spacing:0.04em;margin:0 0 8px;">ORDER CONFIRMED</h1>
    <p style="color:#C9A84C;letter-spacing:0.22em;font-size:11px;text-transform:uppercase;margin:0 0 24px;">Will Power Fitness Factory</p>
    <p>Hey ${params.customerName},</p>
    <p>Thanks for the order. We're printing it now. Tracking info will hit your inbox once it ships.</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;">${itemsHtml}</table>
    <p style="font-size:14px;color:#b8b8b8;">Order #: <strong style="color:#f2f2f2;">${params.orderNumber}</strong></p>
    <p style="font-size:14px;color:#b8b8b8;">Total: <strong style="color:#f2f2f2;">${total}</strong></p>
    <p style="margin-top:32px;font-size:12px;color:#808080;">Questions? Reply to this email or text 314-964-7114.</p>
  </div>
</body></html>`;

  try {
    await resend.emails.send({
      from: `WillPower Fitness Factory <${fromEmail}>`,
      to: params.to,
      subject: `Order confirmed — #${params.orderNumber}`,
      html,
    });
  } catch (err) {
    console.error('[email] send failed', err);
  }
}
