// GET /api/config
//
// Returns public, browser-safe config values. The Stripe PUBLISHABLE
// key is safe to expose (it starts with pk_test_ / pk_live_); the
// SECRET key never leaves the server. The merch page fetches this on
// load so we don't have to hard-code the key into the HTML.

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  });
};
