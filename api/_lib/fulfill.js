// Shared fulfillment helper used by /api/orders (success path) and
// /api/webhooks/stripe (backup path). Both flows funnel through the
// same function so we never double-charge or double-ship.
//
// The function is idempotent: it checks the PaymentIntent's metadata
// for an existing printify_order_id and skips fulfillment if one is
// already there.

const Stripe = require('stripe');

const PRINTIFY_API = 'https://api.printify.com/v1';

// Map our cart product IDs → the env var that holds the matching
// Printify product_id. Once the env vars are populated, orders for
// those products are routed to Printify automatically.
const PRINTIFY_ENV_BY_PRODUCT = {
  tee:      'PRINTIFY_PRODUCT_ID_TEE',
  tank:     'PRINTIFY_PRODUCT_ID_TANK',
  hoodie:   'PRINTIFY_PRODUCT_ID_HOODIE',
  snapback: 'PRINTIFY_PRODUCT_ID_SNAPBACK',
};

async function fulfillOrder(paymentIntentId) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded') {
    throw new Error(`PaymentIntent not succeeded (status=${pi.status})`);
  }

  // Idempotency guard. If we've already submitted this order to
  // Printify (success path beat the webhook, or vice versa), exit
  // early so we don't ship twice.
  if (pi.metadata && pi.metadata.printify_order_id && pi.metadata.printify_order_id !== 'none') {
    return {
      orderNumber: pi.metadata.order_number,
      printifyOrderId: pi.metadata.printify_order_id,
      alreadyFulfilled: true,
      skippedItems: [],
    };
  }

  const orderNumber = pi.metadata.order_number;
  const items = JSON.parse(pi.metadata.items_json || '[]');
  const shippingInfo = JSON.parse(pi.metadata.shipping_json || '{}');

  // Build the Printify line items. If a product has no Printify ID
  // configured yet, we skip that line (the customer is still charged;
  // the operator fulfills manually). We report skipped items in the
  // response so it shows up in Vercel logs.
  const lineItems = [];
  const skippedItems = [];
  for (const item of items) {
    const envKey = PRINTIFY_ENV_BY_PRODUCT[item.id];
    const printifyProductId = envKey ? (process.env[envKey] || '').trim() : '';
    if (!printifyProductId) {
      skippedItems.push(`${item.n} (${item.c}/${item.s}) — no Printify ID configured`);
      continue;
    }

    const variantId = await pickPrintifyVariant(printifyProductId, item.c, item.s);
    if (!variantId) {
      skippedItems.push(`${item.n} (${item.c}/${item.s}) — variant not found in Printify`);
      continue;
    }

    lineItems.push({
      product_id: printifyProductId,
      variant_id: variantId,
      quantity: item.q,
    });
  }

  let printifyOrderId = null;
  let printifyStatus = null;

  if (lineItems.length > 0 && process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID) {
    const [firstName, ...rest] = String(shippingInfo.name || 'Customer').split(' ');
    const lastName = rest.join(' ') || firstName;

    const orderBody = {
      external_id: orderNumber || pi.id,
      label: `WPFF-${(orderNumber || pi.id).slice(-8)}`,
      line_items: lineItems,
      shipping_method: 1, // economy
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: shippingInfo.email,
        country: shippingInfo.country || 'US',
        region: shippingInfo.state,
        address1: shippingInfo.address1,
        address2: shippingInfo.address2 || undefined,
        city: shippingInfo.city,
        zip: shippingInfo.zip,
      },
    };

    const createRes = await fetch(
      `${PRINTIFY_API}/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderBody),
      },
    );
    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Printify create failed (${createRes.status}): ${text}`);
    }
    const created = await createRes.json();
    printifyOrderId = created.id;
    printifyStatus = created.status;

    // Push the order to production. If this step fails the order is
    // still in Printify as a draft and we can submit it manually.
    try {
      const prodRes = await fetch(
        `${PRINTIFY_API}/shops/${process.env.PRINTIFY_SHOP_ID}/orders/${created.id}/send_to_production.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!prodRes.ok) {
        const text = await prodRes.text();
        console.warn('[fulfill] send_to_production non-OK', prodRes.status, text);
      }
    } catch (err) {
      console.warn('[fulfill] send_to_production threw', err);
    }
  }

  // Stamp the PI metadata so the idempotency guard above catches the
  // next call.
  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: {
      ...pi.metadata,
      printify_order_id: printifyOrderId || 'none',
      printify_status: printifyStatus || 'skipped',
      fulfilled_at: new Date().toISOString(),
    },
  });

  return {
    orderNumber,
    printifyOrderId,
    alreadyFulfilled: false,
    skippedItems,
  };
}

// Print-on-demand products in Printify have multiple "variants" (one
// per color × size combo). We match by option title (case-insensitive)
// against the catalog the platform owner configured.
async function pickPrintifyVariant(productId, colorName, sizeName) {
  if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) return null;
  const res = await fetch(
    `${PRINTIFY_API}/shops/${process.env.PRINTIFY_SHOP_ID}/products/${productId}.json`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
      },
    },
  );
  if (!res.ok) return null;
  const product = await res.json();
  const colorOpt = (product.options || []).find(o => /color/i.test(o.name || ''));
  const sizeOpt  = (product.options || []).find(o => /size/i.test(o.name || ''));
  const colorId  = colorOpt?.values?.find(v => (v.title || '').toLowerCase() === String(colorName).toLowerCase())?.id;
  const sizeId   = sizeOpt?.values?.find(v => (v.title || '').toLowerCase() === String(sizeName).toLowerCase())?.id;

  const variant = (product.variants || []).find(v =>
    v.is_enabled && v.is_available &&
    (!colorId || (v.options || []).includes(colorId)) &&
    (!sizeId  || (v.options || []).includes(sizeId))
  );
  return variant ? variant.id : null;
}

module.exports = { fulfillOrder };
