// POST /api/checkout
//
// Body: { items: CartLine[], shippingInfo }
// Returns: { clientSecret, paymentIntentId, orderNumber, breakdown }
//
// Creates a Stripe PaymentIntent that the browser then confirms via the
// Stripe Payment Element. We compute the total server-side so the
// customer can't tamper with prices from the client. The final amount
// includes the GoElev8 platform fee + Stripe pass-through processing
// fee, quoted live from /api/external/fees/quote on the portal so any
// rate change there is picked up automatically.

const Stripe = require('stripe');

// Hardcoded price map kept as a fallback for the case where the portal
// /api/external/products endpoint is unreachable. Once portal-managed
// products are in production, replace this fetch in a follow-up to
// read from there too. For now, the FEES quote uses whatever subtotal
// we compute from this map.
const PRICES = {
  tee:      3499,
  tank:     2799,
  hoodie:   5999,
  snapback: 2999,
};

const FREE_SHIPPING_CENTS = 7500;
const FLAT_SHIPPING_CENTS = 695;
const TENANT_SLUG         = process.env.NEXT_PUBLIC_FLEX_FACILITY_SLUG_WPFF || 'willpower-fitness';
const PORTAL_URL          = (process.env.PORTAL_SYNC_URL || 'https://portal.goelev8.ai').replace(/\/$/, '');

// Fetch the platform fee + Stripe pass-through quote from the portal.
// On any network/HTTP failure we fall back to a zero-fee total — the
// customer still gets charged exactly the listed subtotal + shipping
// so checkout never breaks. The portal records what was actually
// collected, so a missing quote just means we didn't add fees on top
// for that one transaction (rare).
async function quotePlatformFees(subtotalCents, shippingCents) {
  try {
    const res = await fetch(`${PORTAL_URL}/api/external/fees/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: TENANT_SLUG,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents
      })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[checkout] fee quote failed (non-fatal):', err.message);
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, shippingInfo } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (!shippingInfo || !shippingInfo.email || !shippingInfo.address1) {
      return res.status(400).json({ error: 'Shipping info is incomplete.' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    // Compute subtotal from the server-side price map so a tampered
    // client request can't get a $5 hoodie. The client's `price` field
    // is informational only.
    let subtotalCents = 0;
    const safeItems = [];
    for (const line of items) {
      const unit = PRICES[line.productId];
      if (!unit) return res.status(400).json({ error: `Unknown product: ${line.productId}` });
      const qty = Math.max(1, Number(line.quantity) || 1);
      subtotalCents += unit * qty;
      safeItems.push({
        id: line.productId,
        n: line.name,
        c: line.color,
        s: line.size,
        q: qty,
        p: unit / 100,
      });
    }

    const shipping = subtotalCents >= FREE_SHIPPING_CENTS ? 0 : FLAT_SHIPPING_CENTS;

    // Quote the GoElev8 platform fee + Stripe pass-through from the
    // portal. If anything goes wrong, fall back to charging exactly
    // subtotal + shipping (no platform fee on this transaction).
    const feeQuote = await quotePlatformFees(subtotalCents, shipping);
    const platformFeeCents = feeQuote ? feeQuote.platform_fee_cents : 0;
    const stripeFeeCents   = feeQuote ? feeQuote.stripe_fee_cents   : 0;
    const total = feeQuote
      ? feeQuote.customer_total_cents
      : (subtotalCents + shipping);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const orderNumber = `WPFF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      receipt_email: shippingInfo.email,
      automatic_payment_methods: { enabled: true },
      shipping: {
        name: shippingInfo.name,
        address: {
          line1: shippingInfo.address1,
          line2: shippingInfo.address2 || undefined,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.zip,
          country: shippingInfo.country || 'US',
        },
      },
      // Stripe metadata is capped at 500 chars per value, so we keep
      // these compact. items_json + shipping_json together let
      // /api/webhooks/stripe rebuild the full order if the browser
      // never reaches /api/orders (network drop, tab closed, etc.).
      // platform_fee_cents + stripe_fee_cents recorded for the portal
      // sync; subtotal/shipping/total kept handy for refund math.
      metadata: {
        order_number:       orderNumber,
        items_json:         JSON.stringify(safeItems).slice(0, 480),
        shipping_json:      JSON.stringify(shippingInfo).slice(0, 480),
        subtotal_cents:     String(subtotalCents),
        shipping_cents:     String(shipping),
        platform_fee_cents: String(platformFeeCents),
        stripe_fee_cents:   String(stripeFeeCents),
      },
    });

    res.status(200).json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      orderNumber,
      // Breakdown surfaced to the browser so the cart summary can show
      // the customer exactly how their total is composed before they
      // hit Pay.
      breakdown: {
        subtotal_cents:     subtotalCents,
        shipping_cents:     shipping,
        platform_fee_cents: platformFeeCents,
        stripe_fee_cents:   stripeFeeCents,
        total_cents:        total
      }
    });
  } catch (err) {
    console.error('[/api/checkout]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
};
