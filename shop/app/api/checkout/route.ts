import { NextResponse } from 'next/server';
import { stripe, shippingCents } from '@/lib/stripe';
import { getProduct } from '@/lib/products';
import type { CartItem, ShippingInfo } from '@/lib/types';

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WPFF-${ts}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items: CartItem[]; shipping: ShippingInfo };

    if (!body.items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!body.shipping?.email || !body.shipping?.address1) {
      return NextResponse.json({ error: 'Shipping info incomplete' }, { status: 400 });
    }

    let subtotal = 0;
    for (const item of body.items) {
      const product = getProduct(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Unknown product: ${item.productId}` }, { status: 400 });
      }
      subtotal += Math.round(product.price * 100) * item.quantity;
    }
    const shipping = shippingCents(subtotal);
    const total = subtotal + shipping;

    const orderNumber = generateOrderNumber();

    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      receipt_email: body.shipping.email,
      automatic_payment_methods: { enabled: true },
      shipping: {
        name: body.shipping.name,
        phone: body.shipping.phone,
        address: {
          line1: body.shipping.address1,
          line2: body.shipping.address2,
          city: body.shipping.city,
          state: body.shipping.state,
          postal_code: body.shipping.zip,
          country: body.shipping.country || 'US',
        },
      },
      metadata: {
        order_number: orderNumber,
        items_json: JSON.stringify(
          body.items.map((i) => ({
            id: i.productId,
            n: i.name,
            c: i.color,
            s: i.size,
            q: i.quantity,
            p: i.price,
          })),
        ).slice(0, 500),
        shipping_json: JSON.stringify(body.shipping).slice(0, 500),
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret, orderNumber });
  } catch (err) {
    console.error('[/api/checkout]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
