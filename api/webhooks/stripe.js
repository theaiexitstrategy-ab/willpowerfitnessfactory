// POST /api/webhooks/stripe
//
// Backup trigger for Printify fulfillment. The browser also calls
// /api/orders after a successful Stripe payment — this webhook is
// what catches the order if that browser call never lands (tab
// closed, network drop, bot purchase, etc.).
//
// The fulfillOrder() helper is idempotent: if the order was already
// shipped via /api/orders, the webhook noops.

const Stripe = require('stripe');
const { fulfillOrder } = require('../_lib/fulfill');

// IMPORTANT: Stripe verifies signatures against the RAW request body.
// Vercel parses JSON by default, so we disable it for this route and
// read the raw stream ourselves.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event;
  try {
    const raw = await readRawBody(req);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.error('[webhook] signature verify failed', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const result = await fulfillOrder(pi.id);
      console.log('[webhook] fulfilled', { id: pi.id, alreadyFulfilled: result.alreadyFulfilled });
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[webhook] ${event.type} handler failed`, err);
    // Return 500 so Stripe retries the delivery.
    return res.status(500).json({ error: 'Handler error' });
  }
};
