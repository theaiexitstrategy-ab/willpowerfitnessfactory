import Link from 'next/link';
import { stripe } from '@/lib/stripe';

export const metadata = { title: 'Order confirmed | Will Power Fitness Factory' };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { payment_intent?: string };
}) {
  let orderNumber = 'PENDING';
  let totalText = '';
  let email = '';

  if (searchParams.payment_intent && process.env.STRIPE_SECRET_KEY) {
    try {
      const pi = await stripe.paymentIntents.retrieve(searchParams.payment_intent);
      orderNumber = pi.metadata.order_number || pi.id.slice(-8).toUpperCase();
      totalText = `$${(pi.amount / 100).toFixed(2)}`;
      email = pi.receipt_email || '';
    } catch {}
  }

  return (
    <section className="px-5 py-20 min-h-[60vh] flex items-center justify-center">
      <div className="max-w-[560px] w-full text-center border border-border bg-card p-10">
        <div className="inline-flex w-14 h-14 items-center justify-center border border-gold text-gold font-display text-3xl mb-4">
          ✓
        </div>
        <span className="eyebrow">Order Confirmed</span>
        <h1 className="font-display text-[clamp(2rem,6vw,3rem)] mt-2 mb-4">THE WORK STARTS NOW.</h1>
        <p className="font-body font-light text-light leading-relaxed mb-6">
          Order received and headed to print. Tracking info hits your inbox once it ships
          (usually 5–7 business days).
        </p>
        <div className="border-t border-b border-border py-4 mb-6 space-y-1.5">
          <Row label="Order #" value={orderNumber} />
          {totalText && <Row label="Total" value={totalText} />}
          {email && <Row label="Confirmation sent to" value={email} />}
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/shop" className="btn-outline">
            Keep Shopping
          </Link>
          <Link href="/" className="btn-gold">
            Back Home →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="eyebrow">{label}</span>
      <span className="font-condensed font-bold text-white">{value}</span>
    </div>
  );
}
