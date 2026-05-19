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

// All orders are picked up in person at The Flex Facility — no shipping
// is charged to the customer, and Printify ships everything to the gym
// where William receives + holds the order for pickup.
const FLEX_FACILITY = {
  name:    'The Flex Facility (Pickup)',
  address: '4132 Shoreline Dr',
  city:    'Earth City',
  state:   'MO',
  zip:     '63045',
  country: 'US',
};
const TENANT_SLUG = process.env.NEXT_PUBLIC_FLEX_FACILITY_SLUG_WPFF || 'willpower-fitness';
const PORTAL_URL  = (process.env.PORTAL_SYNC_URL || 'https://portal.goelev8.ai').replace(/\/$/, '');

// Fetch the live product price map from the portal. When Will updates
// a price (or adds a new product) in the portal Merch tab, the
// checkout endpoint validates against the new value without a
// redeploy. Falls back to the hardcoded PRICES on any portal outage
// so checkout never breaks on a portal hiccup.
async function fetchPortalPrices() {
  try {
    const r = await fetch(`${PORTAL_URL}/api/external/products?slug=${TENANT_SLUG}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!r.ok) return null;
    const data = await r.json();
    const map = {};
    for (const p of (data.products || [])) {
      if (p.key && Number.isFinite(p.price_cents)) {
        map[p.key] = { unit: p.price_cents, name: p.name };
      }
    }
    return Object.keys(map).length ? map : null;
  } catch (err) {
    console.warn('[checkout] portal price fetch failed (using hardcoded):', err.message);
    return null;
  }
}

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
    const { items, shippingInfo: customerInfo } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required for pickup.' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    // Overlay the Flex Facility address onto the customer's contact info
    // so downstream consumers (Stripe shipping_to, Printify ship-to, and
    // the portal sync) all see "ship to Flex Facility, recipient is the
    // customer who's picking up". Customer name + email + phone are
    // preserved for receipts and pickup coordination.
    const shippingInfo = {
      name:     customerInfo.name,
      email:    customerInfo.email,
      phone:    customerInfo.phone,
      address1: FLEX_FACILITY.address,
      address2: '',
      city:     FLEX_FACILITY.city,
      state:    FLEX_FACILITY.state,
      zip:      FLEX_FACILITY.zip,
      country:  FLEX_FACILITY.country,
    };

    // Compute subtotal from the server-side price map so a tampered
    // client request can't get a $5 hoodie. The client's `price` field
    // is informational only.
    //
    // Portal-managed prices take priority; the hardcoded PRICES map
    // is the fallback when the portal is unreachable. This is what
    // lets Will update prices + add new products from the portal
    // Merch tab without redeploying the storefront.
    const portalPriceMap = await fetchPortalPrices();
    function unitFor(productId) {
      if (portalPriceMap && portalPriceMap[productId]) return portalPriceMap[productId].unit;
      return PRICES[productId];
    }
    let subtotalCents = 0;
    const safeItems = [];
    for (const line of items) {
      const unit = unitFor(line.productId);
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

    // Pickup-only: customer is never charged for shipping. WPFF/Flex
    // absorbs the Printify-to-gym shipping cost (or it's already priced
    // into product margins). Quote still passes shipping_cents=0 so the
    // portal's fee math doesn't get confused.
    const shipping = 0;

    // Quote the GoElev8 platform fee + Stripe pass-through from the
    // portal. If anything goes wrong, fall back to charging exactly
    // the subtotal (no platform fee on this transaction).
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
