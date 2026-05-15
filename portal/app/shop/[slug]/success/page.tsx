import Link from 'next/link';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export default async function StorefrontSuccess({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { session_id?: string };
}) {
  let total = '';
  let email = '';
  if (searchParams.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);
      total = `$${((session.amount_total || 0) / 100).toFixed(2)}`;
      email = session.customer_details?.email || '';
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16" style={{ background: '#000' }}>
      <div className="max-w-[520px] w-full text-center" style={{ border: '1px solid #222', background: '#111', padding: 40 }}>
        <p className="font-condensed uppercase tracking-ultra text-gold text-xs mb-3">Order received</p>
        <h1 className="font-display text-4xl mb-3">THANKS FOR THE ORDER.</h1>
        <p className="text-light font-body leading-relaxed mb-6">
          We're sending it to print right now. Tracking info will be emailed
          {email && <> to <strong className="text-white">{email}</strong></>} once it ships.
        </p>
        {total && <p className="text-silver text-sm mb-6">Total: <strong className="text-white">{total}</strong></p>}
        <Link href={`/shop/${params.slug}`} className="btn-outline">Keep shopping</Link>
      </div>
    </div>
  );
}
