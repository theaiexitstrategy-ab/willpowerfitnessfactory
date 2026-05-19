// POST /api/orders
//
// Body: { paymentIntentId, shippingInfo, items }
//
// Called by the browser after Stripe confirms payment. We re-verify the
// PaymentIntent succeeded against Stripe (so a malicious caller can't
// just POST here with any payment_intent_id), then submit the order to
// Printify and tag the PaymentIntent with the Printify order id.
//
// The Stripe webhook (api/webhooks/stripe.js) is the backup trigger for
// this same fulfillment path so an order still ships even if the user
// closes the tab the moment after paying.

const { fulfillOrder } = require('./_lib/fulfill');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId required' });
    }

    const result = await fulfillOrder(paymentIntentId);

    // Estimated delivery: Printify economy is ~5–7 business days for
    // domestic US. We surface a conservative window to the customer.
    const estDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    res.status(200).json({
      orderId: result.orderNumber,
      printifyOrderId: result.printifyOrderId,
      estimatedDelivery: estDelivery.toISOString(),
      skipped: result.skippedItems,
    });
  } catch (err) {
    console.error('[/api/orders]', err);
    // We still return 200 here so the customer sees success — the
    // webhook will retry, or you can fulfill manually from Stripe
    // metadata. We do not want a Printify hiccup to look like a
    // payment failure to the buyer.
    res.status(200).json({
      orderId: null,
      printifyOrderId: null,
      error: err.message || 'Order recorded but fulfillment queued for manual retry.',
    });
  }
};
