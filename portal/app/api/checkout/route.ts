import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { platformFeeCents, PLANS } from '@/lib/plans';
import type { Client, Product } from '@/lib/types';

type LineRequest = {
  product_id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price_cents: number;
};

export async function POST(req: Request) {
  try {
    const { slug, items } = (await req.json()) as { slug: string; items: LineRequest[] };
    if (!slug || !items?.length) {
      return NextResponse.json({ error: 'Missing slug or items' }, { status: 400 });
    }

    const service = supabaseService();
    const { data: client } = await service
      .from('clients')
      .select('*')
      .eq('store_slug', slug)
      .eq('store_status', 'live')
      .maybeSingle();
    if (!client) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    const c = client as Client;

    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: dbProducts } = await service
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('client_id', c.id)
      .eq('active', true);
    const byId = new Map<string, Product>((dbProducts || []).map((p) => [p.id, p as Product]));

    let subtotal = 0;
    for (const line of items) {
      const dbProduct = byId.get(line.product_id);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not available: ${line.name}` }, { status: 400 });
      }
      // Authoritative price comes from DB, not the request body
      subtotal += dbProduct.price_cents * line.quantity;
    }

    const shippingCents = subtotal >= 7500 ? 0 : 695;
    const totalCents = subtotal + shippingCents;
    const feeCents = platformFeeCents(subtotal, c.plan_tier);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const successUrl = `${siteUrl}/shop/${slug}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/shop/${slug}`;

    const lineItems = items.map((line) => {
      const dbProduct = byId.get(line.product_id)!;
      return {
        quantity: line.quantity,
        price_data: {
          currency: 'usd' as const,
          unit_amount: dbProduct.price_cents,
          product_data: {
            name: dbProduct.name,
            description: `${line.color} · ${line.size}`,
            metadata: { product_id: dbProduct.id, size: line.size, color: line.color },
          },
        },
      };
    });

    if (shippingCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: shippingCents,
          product_data: { name: 'Shipping', metadata: { product_id: 'shipping', size: '', color: '' } },
        },
      });
    }

    const useDestinationCharge =
      c.stripe_account_status === 'active' && c.stripe_account_id;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      metadata: {
        client_id: c.id,
        store_slug: slug,
        platform_fee_cents: String(feeCents),
        items_json: JSON.stringify(items).slice(0, 480),
      },
      ...(useDestinationCharge
        ? {
            payment_intent_data: {
              application_fee_amount: feeCents,
              transfer_data: { destination: c.stripe_account_id! },
            },
          }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[/api/checkout]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
