import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { fulfillOrder } from '../../orders/route';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 },
    );
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.metadata?.fulfilled_at) {
        return NextResponse.json({ received: true, skipped: 'already fulfilled' });
      }
      await fulfillOrder(pi.id);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[webhook] handler for ${event.type} failed:`, err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}
