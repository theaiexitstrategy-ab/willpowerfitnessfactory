# Will Power Fitness Factory — Merch Shop

A self-running merch storefront. Customer pays via Stripe → Printify
automatically creates and ships the order → you collect the margin.
Zero manual order handling.

This README is written so you can follow it step by step even if you've
never deployed code before. Read it top to bottom the first time.

---

## What this is

A Next.js 14 app that lives at its own URL (recommended:
`shop.willpowerfitnessfactory.com`) and serves:

- **`/`** — branded landing page matching willpowerfitnessfactory.com
- **`/shop`** — 6-product merch grid with size/color picker and cart
- **`/checkout`** — 2-step shipping + Stripe payment
- **`/success`** — order confirmation
- **`/admin`** — password-protected dashboard (orders, revenue, top products)

Stripe handles payments. Printify prints and ships. Resend sends order
confirmation emails. No database — orders live in Stripe and are queried
from there.

---

## What you'll do once, ever

1. Create accounts (Stripe, Printify, Resend) — 15 minutes
2. Create your products in Printify — 30 minutes the first time
3. Copy a few keys into a `.env.local` file — 5 minutes
4. Deploy to Vercel — 5 minutes
5. Add the subdomain at Namecheap — 2 minutes + DNS propagation

After that, the shop runs itself. You only touch it to add or change
products.

---

## STEP 1 — Stripe account & test keys

1. Sign up at https://stripe.com.
2. **Stay in TEST MODE** (toggle in the top-left of the Dashboard) until
   you've placed a real end-to-end test order. The toggle says "Test mode"
   vs "Live mode" — these have separate sets of keys.
3. Go to **Developers → API keys** (https://dashboard.stripe.com/test/apikeys).
4. Copy:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...`) — click "Reveal" first
5. Save both — you'll paste them into `.env.local` in Step 5.

You'll add the webhook secret later, after you deploy (Step 7).

---

## STEP 2 — Printify account & API key

1. Sign up at https://printify.com.
2. Connect a sales channel (pick **"My own store" / API**) when prompted —
   this gives you a `shop_id`.
3. Go to **My Account → Connections → API tokens**
   (https://printify.com/app/account/api).
4. Click **Generate token**, scope it to all products & orders, copy the
   token. Treat it like a password.
5. Find your **shop ID**:
   - Open https://api.printify.com/v1/shops.json in a browser? No — it
     requires authentication. Easiest path: paste this into a terminal:
     ```bash
     curl -H "Authorization: Bearer YOUR_PRINTIFY_TOKEN" \
       https://api.printify.com/v1/shops.json
     ```
   - The JSON response lists your shops with `id` fields. Pick the one
     that matches the store name you set up.
   - Save this as `PRINTIFY_SHOP_ID`.

### Creating your products

In your Printify dashboard:

1. **Catalog → choose a base product** (e.g. Bella + Canvas 3001 for tees,
   Gildan 18500 for hoodies — pick whatever quality/price tier you want).
2. **Upload your design** — use `wpff-logo-white.png` from the main repo
   or your variant of choice.
3. **Choose variants** — pick which colors and sizes to offer. The shop
   currently expects:
   - **Tee, Hoodie, Tank, Joggers**: sizes S, M, L, XL, 2XL
   - **Snapback, Tumbler**: One Size
   - Colors are listed in `lib/products.ts` (Black, White, Charcoal, Gold
     where applicable)
   - **If you offer a color or size that's not in `lib/products.ts`,
     customers can't pick it. Either match the catalog to your products,
     or edit `lib/products.ts` to match what you actually carry.**
4. **Set retail price** — Printify auto-suggests one. The price shown to
   customers is hard-coded in `lib/products.ts` and what Stripe charges.
   Make sure your Printify price (what you pay) plus shipping leaves a
   margin under our listed retail price.
5. **Save the product**, then go to its detail page. The URL contains
   the product ID:
   `https://printify.com/app/products/PRINTIFY_PRODUCT_ID/...`
6. Repeat for all 6 products. Save each `PRINTIFY_PRODUCT_ID`.

**Until you fill in product IDs, the shop displays a kettlebell
placeholder.** Customers can still order, but the order will skip any
product with no Printify ID (the admin dashboard flags it).

---

## STEP 3 — Resend account (for order confirmation emails)

1. Sign up at https://resend.com.
2. **Add your sending domain** — `willpowerfitnessfactory.com` — and
   follow Resend's DNS instructions (you'll add a few TXT records at
   Namecheap). This is required to send from a `@willpowerfitnessfactory.com`
   email address.
3. While you're waiting on domain verification, you can use Resend's
   onboarding test domain — set `RESEND_FROM_EMAIL=onboarding@resend.dev`
   temporarily.
4. **API Keys → Create** → copy the `re_...` key.

If you don't set up Resend, that's fine — the shop will skip the
confirmation email but every other part still works.

---

## STEP 4 — Clone & install locally (optional but recommended)

You can skip this if you want to deploy directly to Vercel, but
testing locally first catches issues fast.

```bash
git clone https://github.com/theaiexitstrategy-ab/willpowerfitnessfactory.git
cd willpowerfitnessfactory/shop
npm install
```

You need Node.js 18.18+ installed. Get it at https://nodejs.org.

---

## STEP 5 — Fill in `.env.local`

```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor and paste in the values you
collected in Steps 1–3.

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=             # filled in Step 7
PRINTIFY_API_KEY=ey...
PRINTIFY_SHOP_ID=12345678
PRINTIFY_PRODUCT_TEE=               # Printify product ID for the tee
PRINTIFY_PRODUCT_HOODIE=
PRINTIFY_PRODUCT_SNAPBACK=
PRINTIFY_PRODUCT_JOGGERS=
PRINTIFY_PRODUCT_TANK=
PRINTIFY_PRODUCT_TUMBLER=
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@willpowerfitnessfactory.com
ADMIN_PASSWORD=pickSomethingLongAndRandom
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run it:

```bash
npm run dev
```

Open http://localhost:3000 — you should see the homepage. Click **SHOP**,
add a product, run through checkout with Stripe's test card:

- Card: `4242 4242 4242 4242`
- Exp: any future date
- CVC: any 3 digits
- ZIP: any 5 digits

If payment succeeds you'll land on `/success`. The Printify side
won't trigger locally without a public webhook — you'll test that
after deploying.

Log in to `/admin` with your `ADMIN_PASSWORD` to see the order show up.

---

## STEP 6 — Deploy to Vercel

1. Sign up / log in at https://vercel.com with GitHub.
2. **Add New → Project** → import `theaiexitstrategy-ab/willpowerfitnessfactory`.
3. Project name: `wpff-shop` (or whatever)
4. **Root Directory** → click *Edit* → choose `shop`.
5. **Environment Variables** → paste every key/value from your
   `.env.local` file. Do this BEFORE clicking Deploy.
6. Click **Deploy**. Wait ~60 seconds.
7. You'll get a `*.vercel.app` URL. Visit it to confirm everything works.

**Update `NEXT_PUBLIC_SITE_URL`** to the Vercel URL (or your final
subdomain). Settings → Environment Variables → edit `NEXT_PUBLIC_SITE_URL`
→ Save → Deployments → Redeploy.

---

## STEP 7 — Add the Stripe webhook

The webhook is what tells Printify to create the order after Stripe
confirms payment.

1. In Stripe dashboard (still test mode), go to
   **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-DEPLOYED-URL/api/webhooks/stripe`
3. **Events to send** → click "Select events" → search and check
   only: `payment_intent.succeeded`
4. Click **Add endpoint**.
5. On the endpoint detail page, click **Reveal** under "Signing secret".
   Copy the `whsec_...` value.
6. Back in Vercel → project Settings → Environment Variables → add
   `STRIPE_WEBHOOK_SECRET=whsec_...` → Save → Deployments → Redeploy.

To test:
- Place a test order through the live deployed URL.
- In Stripe dashboard → Webhooks → your endpoint → "Recent deliveries"
  should show a `payment_intent.succeeded` with HTTP 200.
- In Printify dashboard → Orders, the order should appear within a
  few seconds with status "On hold" or "Submitted".

---

## STEP 8 — Point a subdomain at it

Two options. Pick one:

### Option A (recommended): subdomain `shop.willpowerfitnessfactory.com`

1. In Vercel → project Settings → Domains → Add
   `shop.willpowerfitnessfactory.com`.
2. Vercel will tell you to add a `CNAME` record at your DNS host.
3. Log in to Namecheap → Domain List → `willpowerfitnessfactory.com`
   → Manage → Advanced DNS → Add new record:
   - Type: `CNAME`
   - Host: `shop`
   - Value: `cname.vercel-dns.com`
   - TTL: Automatic
4. Wait ~5–30 minutes for DNS to propagate. Vercel auto-issues an SSL
   cert.
5. Update `NEXT_PUBLIC_SITE_URL=https://shop.willpowerfitnessfactory.com`
   in Vercel env vars → Redeploy.

### Option B: path on main site (`willpowerfitnessfactory.com/shop`)

Add a `vercel.json` to the **root** of the repo (the static site, not
this `shop/` folder) with a rewrite to proxy `/shop/*` to the deployed
shop app:

```json
{
  "rewrites": [
    { "source": "/shop", "destination": "https://shop.willpowerfitnessfactory.com/shop" },
    { "source": "/shop/:path*", "destination": "https://shop.willpowerfitnessfactory.com/shop/:path*" }
  ]
}
```

You still need to do Option A first — the rewrite proxies to that
subdomain.

---

## STEP 9 — Going live (switching from test to live mode)

When you're ready to accept real money:

1. In Stripe dashboard, **toggle to Live mode** (top-left).
2. **Developers → API keys** → copy the LIVE `pk_live_...` and
   `sk_live_...`.
3. **Developers → Webhooks** → repeat Step 7 in live mode (creates a
   NEW webhook endpoint with its own signing secret).
4. In Vercel → Environment Variables → update all three:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
5. Redeploy.

Place one real order with your own card to make sure the full chain
fires (payment → webhook → Printify order → shipping). Refund yourself
in Stripe afterwards.

---

## Working on the shop later

### Updating prices
Edit `lib/products.ts` → push to GitHub → Vercel auto-redeploys. Make
sure the Printify base cost still leaves a margin.

### Changing the product list
Edit `lib/products.ts` and add/remove entries. Each new product needs a
matching `PRINTIFY_PRODUCT_*` env var in Vercel and a created Printify
product.

### Changing colors/sizes available
Edit `lib/products.ts` — but make sure whatever you list matches the
variants you actually offer in Printify (otherwise `pickVariant` in
`api/orders/route.ts` won't find a match and that line item will be
skipped).

### Changing the admin password
Update `ADMIN_PASSWORD` in Vercel env vars → Redeploy. Old sessions
expire next time the page loads.

---

## File map

```
shop/
├── app/
│   ├── page.tsx              # homepage
│   ├── shop/page.tsx         # /shop merch grid
│   ├── checkout/page.tsx     # /checkout
│   ├── success/page.tsx      # /success
│   ├── admin/page.tsx        # /admin dashboard
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── products/         # GET — fetches Printify-enriched product list
│       ├── checkout/         # POST — creates Stripe PaymentIntent
│       ├── orders/           # POST — creates Printify order from PI
│       ├── webhooks/stripe/  # POST — Stripe webhook handler
│       └── admin/login,logout/
├── components/
│   ├── Nav.tsx, Footer.tsx, Logo.tsx
│   ├── CartProvider.tsx, CartPanel.tsx
│   ├── ProductGrid.tsx, ProductModal.tsx
│   └── CheckoutForm.tsx
├── lib/
│   ├── products.ts           # ⭐ EDIT THIS to change the catalog
│   ├── stripe.ts, printify.ts, email.ts
│   ├── admin-auth.ts
│   └── types.ts
└── .env.example
```

---

## Common issues

**"Payment succeeded but no Printify order was created"**
1. Check Vercel logs: Project → Deployments → click the latest →
   Functions → look for `/api/webhooks/stripe` invocations.
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly (very common cause).
3. Confirm in Stripe → Webhooks → "Recent deliveries" that the event
   returned HTTP 200, not 4xx/5xx.
4. Make sure the product has a `PRINTIFY_PRODUCT_*` env var set in
   Vercel — items with no Printify ID are skipped silently.

**"Customer picked a color/size and Printify didn't ship that variant"**
The variant matching in `app/api/orders/route.ts → pickVariant` matches
on the Printify option title (case-insensitive). If your Printify
catalog calls a color "Heather Black" but `lib/products.ts` lists
"Black", they won't match. Either rename the catalog color or update
`products.ts`.

**"Admin page shows no orders even though I have some"**
The dashboard queries Stripe directly. If you switched between test and
live mode keys, you're looking at different sets of payments. Check
that the `STRIPE_SECRET_KEY` in Vercel matches the mode you placed
orders in.

**"I changed something but the live site looks the same"**
Vercel caches the homepage and shop page for 5 minutes. Hard refresh
(Ctrl-Shift-R / Cmd-Shift-R) or trigger a redeploy.
