// POST /api/checkout
//
// Body: { items: CartLine[], shippingInfo }
// Returns: { clientSecret, paymentIntentId }
//
// Creates a Stripe PaymentIntent that the browser then confirms via the
// Stripe Payment Element. We compute the total server-side so the
// customer can't tamper with prices from the client.

const Stripe = require('stripe');

const PRICES = {
  tee:      3499,
  tank:     2799,
  hoodie:   5999,
  snapback: 2999,
};

const FREE_SHIPPING_CENTS = 7500;
const FLAT_SHIPPING_CENTS = 695;

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
    const total = subtotalCents + shipping;

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
      metadata: {
        order_number: orderNumber,
        items_json: JSON.stringify(safeItems).slice(0, 480),
        shipping_json: JSON.stringify(shippingInfo).slice(0, 480),
      },
    });

    res.status(200).json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      orderNumber,
    });
  } catch (err) {
    console.error('[/api/checkout]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
};
