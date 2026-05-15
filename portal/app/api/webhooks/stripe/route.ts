import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseService } from '@/lib/supabase/server';
import {
  createPrintifyOrder,
  getPrintifyProduct,
  submitPrintifyOrderToProduction,
} from '@/lib/printify';
import { sendOrderNotification } from '@/lib/resend';
import { PLANS, platformFeeCents } from '@/lib/plans';
import { getTemplate } from '@/lib/product-templates';
import type { Client, OrderItem, Product, ProductTemplateKey } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('[webhook] signature verify failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await onSubscriptionChanged(event.data.object as Stripe.Subscription);
        break;
      case 'account.updated':
        await onAccountUpdated(event.data.object as Stripe.Account);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[webhook] ${event.type} handler failed`, err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}

// ----- handlers -----

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'payment') return;
  const meta = session.metadata || {};
  const clientId = meta.client_id;
  if (!clientId) return;

  const service = supabaseService();
  const { data: client } = await service.from('clients').select('*').eq('id', clientId).maybeSingle();
  if (!client) return;
  const c = client as Client;

  let items: OrderItem[] = [];
  try {
    const parsed = JSON.parse(meta.items_json || '[]') as Array<{
      product_id: string;
      name: string;
      size: string;
      color: string;
      quantity: number;
      price_cents: number;
    }>;
    items = parsed.map((i) => ({
      product_id: i.product_id,
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price_cents: i.price_cents,
    }));
  } catch {}

  const subtotal = items.reduce((s, i) => s + i.price_cents * i.quantity, 0);
  const shipping = (session.amount_total || 0) - subtotal;
  const total = session.amount_total || 0;
  const fee = platformFeeCents(subtotal, c.plan_tier);

  const customerEmail = session.customer_details?.email || '';
  const customerName = session.customer_details?.name || '';
  const shippingDetails = (session as any).shipping_details || (session as any).shipping || null;

  const { data: order } = await service
    .from('orders')
    .insert({
      client_id: c.id,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_json: shippingDetails,
      items_json: items,
      subtotal_cents: subtotal,
      shipping_cents: Math.max(0, shipping),
      platform_fee_cents: fee,
      total_cents: total,
      stripe_payment_id: session.payment_intent as string,
      status: 'paid',
    })
    .select()
    .single();

  await service
    .from('clients')
    .update({
      total_orders: c.total_orders + 1,
      monthly_revenue_cents: c.monthly_revenue_cents + (total - fee),
    })
    .eq('id', c.id);

  // Send to Printify
  if (process.env.PRINTIFY_API_KEY && shippingDetails?.address) {
    try {
      const lineItems = await Promise.all(
        items.map(async (i) => {
          const { data: dbProduct } = await service
            .from('products')
            .select('*')
            .eq('id', i.product_id)
            .single();
          const product = dbProduct as Product | null;
          if (!product?.printify_product_id) return null;
          const printify = await getPrintifyProduct(product.printify_product_id);
          if (!printify) return null;

          const colorOpt = printify.options.find((o) => o.name.toLowerCase().includes('color'));
          const sizeOpt = printify.options.find((o) => o.name.toLowerCase().includes('size'));
          const colorId = colorOpt?.values.find((v) => v.title.toLowerCase() === i.color.toLowerCase())?.id;
          const sizeId = sizeOpt?.values.find((v) => v.title.toLowerCase() === i.size.toLowerCase())?.id;
          const variant = printify.variants.find(
            (v) =>
              v.is_enabled && v.is_available &&
              (!colorId || v.options.includes(colorId)) &&
              (!sizeId || v.options.includes(sizeId)),
          );
          if (!variant) return null;
          return { product_id: product.printify_product_id, variant_id: variant.id, quantity: i.quantity };
        }),
      );
      const validLines = lineItems.filter((l): l is NonNullable<typeof l> => !!l);
      if (validLines.length > 0) {
        const addr = shippingDetails.address as Record<string, string>;
        const [firstName, ...rest] = (customerName || 'Customer').split(' ');
        const created = await createPrintifyOrder({
          externalId: order?.id || session.id,
          label: `WPFF-${c.business_name.slice(0, 10)}-${(order?.id || session.id).slice(-6)}`,
          lineItems: validLines,
          address: {
            first_name: firstName || 'Customer',
            last_name: rest.join(' ') || firstName,
            email: customerEmail,
            country: addr.country || 'US',
            region: addr.state || '',
            address1: addr.line1 || '',
            address2: addr.line2,
            city: addr.city || '',
            zip: addr.postal_code || '',
          },
        });
        try {
          await submitPrintifyOrderToProduction(created.id);
        } catch (err) {
          console.warn('[webhook] send_to_production failed', err);
        }
        await service
          .from('orders')
          .update({ printify_order_id: created.id, status: 'printing' })
          .eq('id', order?.id);
      }
    } catch (err) {
      console.error('[webhook] Printify routing failed', err);
    }
  }

  if (PLANS[c.plan_tier].perOrderEmails && c.email) {
    await sendOrderNotification({
      to: c.email,
      businessName: c.business_name,
      orderTotal: total,
      customerName: customerName || customerEmail,
    });
  }
}

async function onSubscriptionChanged(subscription: Stripe.Subscription) {
  const service = supabaseService();
  const customerId = subscription.customer as string;

  const priceId = subscription.items.data[0]?.price.id;
  const proPrice = process.env.STRIPE_PRICE_PRO;
  const elitePrice = process.env.STRIPE_PRICE_ELITE;
  let planTier: 'free' | 'pro' | 'elite' = 'free';
  if (priceId && priceId === elitePrice) planTier = 'elite';
  else if (priceId && priceId === proPrice) planTier = 'pro';

  const status = subscription.status;
  const isCancelled = status === 'canceled' || status === 'incomplete_expired';

  await service
    .from('clients')
    .update({
      plan_tier: isCancelled ? 'free' : planTier,
      stripe_subscription_id: isCancelled ? null : subscription.id,
    })
    .eq('stripe_customer_id', customerId);
}

async function onAccountUpdated(account: Stripe.Account) {
  const service = supabaseService();
  const ready = account.charges_enabled && account.details_submitted && account.payouts_enabled;
  await service
    .from('clients')
    .update({ stripe_account_status: ready ? 'active' : 'pending' })
    .eq('stripe_account_id', account.id);
}
