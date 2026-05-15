'use client';

import { useState, useMemo, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from './CartProvider';
import type { ShippingInfo } from '@/lib/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type Step = 'shipping' | 'payment';

export default function CheckoutForm() {
  const { items, subtotalCents } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [shipping, setShipping] = useState<ShippingInfo>({
    name: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
  });
  const [clientSecret, setClientSecret] = useState<string>('');
  const [intentError, setIntentError] = useState<string>('');

  const shippingCents = subtotalCents >= 7500 ? 0 : 695;
  const totalCents = subtotalCents + shippingCents;

  if (items.length === 0) {
    return (
      <div className="border border-border bg-card p-10 text-center">
        <p className="font-condensed uppercase tracking-widest text-silver mb-4">Your cart is empty</p>
        <Link href="/shop" className="btn-gold">
          Shop the Drop →
        </Link>
      </div>
    );
  }

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    setIntentError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shipping }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start payment');
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err) {
      setIntentError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
      <div>
        <ol className="flex items-center gap-4 mb-8">
          <Step n={1} label="Shipping" active={step === 'shipping'} done={step === 'payment'} />
          <span className="h-px flex-1 bg-border" />
          <Step n={2} label="Payment" active={step === 'payment'} done={false} />
        </ol>

        {step === 'shipping' && (
          <form onSubmit={handleProceedToPayment} className="space-y-4">
            <Field label="Full name" value={shipping.name} onChange={(v) => setShipping({ ...shipping, name: v })} required />
            <Field label="Email" type="email" value={shipping.email} onChange={(v) => setShipping({ ...shipping, email: v })} required />
            <Field label="Address" value={shipping.address1} onChange={(v) => setShipping({ ...shipping, address1: v })} required />
            <Field label="Apt / Suite (optional)" value={shipping.address2 || ''} onChange={(v) => setShipping({ ...shipping, address2: v })} />
            <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-4">
              <Field label="City" value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} required />
              <Field label="State" value={shipping.state} onChange={(v) => setShipping({ ...shipping, state: v.toUpperCase() })} required maxLength={2} placeholder="MO" />
              <Field label="ZIP" value={shipping.zip} onChange={(v) => setShipping({ ...shipping, zip: v })} required maxLength={10} />
            </div>
            <Field label="Phone (optional)" type="tel" value={shipping.phone || ''} onChange={(v) => setShipping({ ...shipping, phone: v })} />

            {intentError && (
              <p className="text-red-400 font-condensed text-sm tracking-widest uppercase">{intentError}</p>
            )}

            <button type="submit" className="btn-gold w-full">
              Continue to Payment →
            </button>
          </form>
        )}

        {step === 'payment' && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#C9A84C',
                  colorBackground: '#0a0a0a',
                  colorText: '#f2f2f2',
                  colorDanger: '#ef4444',
                  fontFamily: 'Barlow, sans-serif',
                  borderRadius: '0px',
                },
              },
            }}
          >
            <PaymentStep totalCents={totalCents} shipping={shipping} />
          </Elements>
        )}
      </div>

      <aside className="border border-border bg-card p-6 h-fit lg:sticky lg:top-[80px]">
        <h3 className="font-display text-xl tracking-wider mb-4">ORDER SUMMARY</h3>
        <ul className="space-y-2 mb-4">
          {items.map((i) => (
            <li
              key={`${i.productId}-${i.color}-${i.size}`}
              className="flex justify-between gap-3 text-sm font-body"
            >
              <span className="text-light">
                {i.quantity}× {i.name}{' '}
                <span className="text-silver text-xs">
                  ({i.color} · {i.size})
                </span>
              </span>
              <span className="font-condensed font-bold text-white whitespace-nowrap">
                ${(i.price * i.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border pt-4 space-y-1 text-sm font-condensed">
          <SummaryLine label="Subtotal" value={`$${(subtotalCents / 100).toFixed(2)}`} />
          <SummaryLine
            label="Shipping"
            value={shippingCents === 0 ? 'FREE' : `$${(shippingCents / 100).toFixed(2)}`}
          />
          <SummaryLine
            label="Total"
            value={`$${(totalCents / 100).toFixed(2)}`}
            bold
          />
        </div>
      </aside>
    </div>
  );
}

function PaymentStep({
  totalCents,
  shipping,
}: {
  totalCents: number;
  shipping: ShippingInfo;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { clear } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${siteUrl}/success`,
        receipt_email: shipping.email,
        shipping: {
          name: shipping.name,
          phone: shipping.phone,
          address: {
            line1: shipping.address1,
            line2: shipping.address2,
            city: shipping.city,
            state: shipping.state,
            postal_code: shipping.zip,
            country: shipping.country,
          },
        },
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setSubmitting(false);
      return;
    }

    clear();
    router.push('/success');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-400 font-condensed text-sm tracking-widest uppercase">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn-gold w-full disabled:opacity-50"
      >
        {submitting ? 'Processing…' : `Pay $${(totalCents / 100).toFixed(2)}`}
      </button>
      <p className="text-xs text-silver text-center">Secured by Stripe. Your card details never touch our servers.</p>
    </form>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`w-7 h-7 inline-flex items-center justify-center border ${
          active ? 'border-gold text-gold' : done ? 'border-white text-white' : 'border-border text-silver'
        } font-condensed font-bold`}
      >
        {done ? '✓' : n}
      </span>
      <span
        className={`font-condensed uppercase tracking-widest text-xs ${
          active ? 'text-white' : 'text-silver'
        }`}
      >
        {label}
      </span>
    </li>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow block mb-1.5">{props.label}</span>
      <input
        type={props.type || 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
        className="w-full bg-card border border-border text-white font-body px-4 py-3 outline-none focus:border-gold transition-colors"
      />
    </label>
  );
}

function SummaryLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={`uppercase tracking-widest text-silver ${bold ? 'text-white' : ''}`}>{label}</span>
      <span className={bold ? 'font-bold text-white text-base' : 'font-bold text-white'}>{value}</span>
    </div>
  );
}
