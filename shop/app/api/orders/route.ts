import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getProduct, productPrintifyId } from '@/lib/products';
import { getPrintifyProduct, createPrintifyOrder, submitPrintifyOrderToProduction } from '@/lib/printify';
import { sendOrderConfirmation } from '@/lib/email';
import type { CartItem, ShippingInfo } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { paymentIntentId } = (await req.json()) as { paymentIntentId: string };
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

    const result = await fulfillOrder(paymentIntentId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/orders]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function fulfillOrder(paymentIntentId: string) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== 'succeeded') {
    throw new Error(`Payment intent not succeeded (status=${pi.status})`);
  }

  const orderNumber = pi.metadata.order_number;
  const items: CartItem[] = JSON.parse(pi.metadata.items_json || '[]').map((i: any) => ({
    productId: i.id,
    name: i.n,
    color: i.c,
    size: i.s,
    quantity: i.q,
    price: i.p,
  }));
  const shipping = JSON.parse(pi.metadata.shipping_json || '{}') as ShippingInfo;

  const lineItems = [];
  const skippedItems: string[] = [];

  for (const item of items) {
    const product = getProduct(item.productId);
    if (!product) {
      skippedItems.push(`${item.name} (unknown product)`);
      continue;
    }
    const printifyProductId = productPrintifyId(product.printifyEnvKey);
    if (!printifyProductId) {
      skippedItems.push(`${item.name} (no Printify ID configured)`);
      continue;
    }

    const printify = await getPrintifyProduct(printifyProductId);
    if (!printify) {
      skippedItems.push(`${item.name} (Printify lookup failed)`);
      continue;
    }

    const variant = pickVariant(printify, item.color, item.size);
    if (!variant) {
      skippedItems.push(`${item.name} — ${item.color}/${item.size} (variant not found)`);
      continue;
    }

    lineItems.push({
      product_id: printifyProductId,
      variant_id: variant.id,
      quantity: item.quantity,
    });
  }

  const [firstName, ...rest] = (shipping.name || '').split(' ');
  const lastName = rest.join(' ') || firstName || 'Customer';

  let printifyOrderId: string | null = null;
  let printifyStatus: string | null = null;

  if (lineItems.length > 0 && process.env.PRINTIFY_API_KEY) {
    try {
      const created = await createPrintifyOrder({
        externalId: orderNumber || pi.id,
        label: orderNumber,
        lineItems,
        address: {
          first_name: firstName || 'Customer',
          last_name: lastName,
          email: shipping.email,
          phone: shipping.phone,
          country: shipping.country || 'US',
          region: shipping.state,
          address1: shipping.address1,
          address2: shipping.address2,
          city: shipping.city,
          zip: shipping.zip,
        },
      });
      printifyOrderId = created.id;
      printifyStatus = created.status;
      try {
        await submitPrintifyOrderToProduction(created.id);
      } catch (err) {
        console.warn('[/api/orders] send_to_production failed (order created but not submitted):', err);
      }
    } catch (err) {
      console.error('[/api/orders] Printify order creation failed:', err);
    }
  }

  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: {
      ...pi.metadata,
      printify_order_id: printifyOrderId || 'none',
      printify_status: printifyStatus || 'skipped',
      fulfilled_at: new Date().toISOString(),
    },
  });

  try {
    await sendOrderConfirmation({
      to: shipping.email,
      orderNumber: orderNumber || pi.id.slice(-8).toUpperCase(),
      customerName: firstName || 'there',
      totalCents: pi.amount,
      items,
    });
  } catch (err) {
    console.warn('[/api/orders] confirmation email failed:', err);
  }

  return {
    success: true,
    orderNumber,
    printifyOrderId,
    skippedItems,
  };
}

function pickVariant(
  printify: { variants: any[]; options: any[] },
  color: string,
  size: string,
) {
  const colorOpt = printify.options.find((o) => o.name.toLowerCase().includes('color'));
  const sizeOpt = printify.options.find((o) => o.name.toLowerCase().includes('size'));

  const colorValueId = colorOpt?.values.find(
    (v: any) => v.title.toLowerCase() === color.toLowerCase(),
  )?.id;
  const sizeValueId = sizeOpt?.values.find(
    (v: any) => v.title.toLowerCase() === size.toLowerCase(),
  )?.id;

  return printify.variants.find(
    (v) =>
      v.is_enabled &&
      v.is_available &&
      (!colorValueId || v.options.includes(colorValueId)) &&
      (!sizeValueId || v.options.includes(sizeValueId)),
  );
}
