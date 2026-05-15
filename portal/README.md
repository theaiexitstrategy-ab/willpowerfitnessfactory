# Will Power Fitness Factory — Merch Platform (Phase 2)

A self-service portal where fitness brands, gyms, and trainers sign up,
upload their logo, pick products, and launch their own merch storefront
in under 10 minutes. WillPower Fitness Factory hosts the platform, takes
a percentage of every order, and the clients receive their payouts via
their own Stripe accounts.

This is Phase 2. Phase 1 (WPFF's own merch shop) lives in `../shop/` and
is independent of this app.

This README is written so you can stand the whole thing up even if you've
never deployed code before. Read it top to bottom the first time.

---

## What this app does

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT SIDE                                                         │
│  /                          → marketing landing + pricing            │
│  /portal/signup             → create account + (optional) subscribe  │
│  /portal/onboarding         → 4-step wizard (brand, products,        │
│                                preview, launch)                      │
│  /portal/dashboard          → dashboard home (revenue, recent orders)│
│    /dashboard/store         → edit storefront branding               │
│    /dashboard/products      → toggle products, set prices            │
│    /dashboard/orders        → orders + tracking                      │
│    /dashboard/settings      → link Stripe account, custom domain     │
│    /dashboard/billing       → plan management, invoices              │
│                                                                       │
│  CUSTOMER SIDE                                                       │
│  /shop/[slug]               → that client's storefront               │
│  /shop/[slug]/success       → post-checkout confirmation             │
└─────────────────────────────────────────────────────────────────────┘
```

When a customer pays, Stripe holds the funds, splits a platform fee to
WPFF and the remainder to the client's connected Stripe account, fires a
webhook → our server creates a Printify order → Printify prints + ships.

---

## What's NOT in this build (deferred to Phase 2B)

Read this carefully so you don't promise something that isn't here yet.

- **Live analytics charts** — the dashboard shows numbers in tables. No
  line/bar charts yet.
- **Automatic logo mockup generation in Printify** — you (the platform
  operator) still need to create each client's products in your Printify
  dashboard and paste their printify_product_id into the products table.
  The portal stores everything else automatically.
- **Custom domain UI for Elite clients** — Settings shows manual
  instructions; you attach domains in Vercel by hand for now.
- **Per-order email notification toggle** — Pro and Elite clients get
  every-order emails automatically; there's no UI to opt out yet.
- **AI logo placement** — Printify centers artwork in the print area by
  default; no AI positioning.

If a client asks about these, the answer is "coming soon."

---

## STEP 1 — Supabase project

1. Sign up at https://supabase.com → New Project.
2. Settings → API → copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. Open **SQL Editor** → paste the contents of
   `supabase/migrations/001_initial.sql` → Run.
4. Authentication → Providers → leave "Email" enabled.
   **Disable "Confirm email"** for now (faster client onboarding;
   re-enable in production if you want stricter signups).

---

## STEP 2 — Stripe account & subscription products

1. Sign up at https://stripe.com. Stay in **Test Mode** until launch.
2. Settings → API keys → copy `pk_test_...` and `sk_test_...`.
3. Create the two recurring products:
   - **Products → Add product → "WillPower Merch Pro"**
     - Recurring, **$29.00 USD / month**
     - After save, copy the price ID (starts with `price_...`) →
       `STRIPE_PRICE_PRO`
   - **Products → Add product → "WillPower Merch Elite"**
     - Recurring, **$79.00 USD / month**
     - Price ID → `STRIPE_PRICE_ELITE`
4. **Connect** → Settings (https://dashboard.stripe.com/test/settings/connect)
   - Platform name: "WillPower Fitness Factory Merch"
   - Branding: upload your logo, set accent color
   - Enable "Stripe-hosted onboarding"
   - Copy the **client ID** (starts with `ca_...`) → `STRIPE_CONNECT_CLIENT_ID`
5. **Customer portal** — Settings → Billing → Customer portal → activate
   the test mode portal. Allow customers to cancel and update payment
   method.

You'll add the webhook secret after deploying (Step 7).

---

## STEP 3 — Printify

You manage **ONE** Printify account that fulfills every client's orders.

1. Sign up at https://printify.com.
2. Connect a sales channel → "My own store / API". This creates a shop.
3. Generate an API token at https://printify.com/app/account/api
4. Find your `shop_id` (use the API key with a `curl` against
   `https://api.printify.com/v1/shops.json`).
5. Save both to `.env.local` as `PRINTIFY_API_KEY` and `PRINTIFY_SHOP_ID`.

### How client products work in Printify

When a client toggles a product on in their portal, we save it to our DB
with a base cost and retail price, but we **don't** create a Printify
product automatically (yet).

After onboarding, **you** (the operator) need to:

1. Open Printify dashboard → Catalog → pick the base product
   (e.g. Bella+Canvas 3001 for a tee).
2. Upload the client's logo (download from the Cloudinary URL stored in
   `clients.logo_url`).
3. Set variants + price, save the product, copy the Printify
   `product_id`.
4. In Supabase SQL editor:
   ```sql
   update public.products
   set printify_product_id = 'PASTED_HERE'
   where client_id = 'CLIENT_UUID'
     and template_key = 'tee';
   ```

Until `printify_product_id` is set, orders for that product line
**won't** be sent to Printify automatically (the order is still captured
in Stripe + DB so no payment is lost).

> Roadmap: Phase 2B will use Printify's product API to create these
> automatically when the client uploads their logo. Until then, plan on
> spending ~10 minutes per new client setting up their 5–8 products.

---

## STEP 4 — Cloudinary

1. Sign up at https://cloudinary.com (free tier is fine).
2. Dashboard → top section → copy the **cloud name**, then click
   "Account Details" to reveal the full `cloudinary://...` URL.
3. Settings → **Upload** → Add upload preset:
   - Preset name: `wpff_portal` (or whatever)
   - Signing mode: **Unsigned**
   - Folder: `wpff/clients` (so all logos land in one place)
   - Allowed formats: `png, jpg, jpeg, webp, svg`
   - Save
4. Paste into `.env.local`:
   - `CLOUDINARY_URL=cloudinary://...`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name>`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=wpff_portal`

---

## STEP 5 — Resend (transactional email)

1. Sign up at https://resend.com.
2. Add domain `willpowerfitnessfactory.com` → follow Resend's DNS
   instructions (TXT records at Namecheap).
3. API Keys → Create → copy → `RESEND_API_KEY`.
4. Set `RESEND_FROM_EMAIL` to e.g. `hello@willpowerfitnessfactory.com`
   (must be on the verified domain).

If you skip this, signup and orders still work — clients just won't get
emails.

---

## STEP 6 — Local development

```bash
cd portal
npm install
cp .env.example .env.local
# paste all the values from Steps 1–5 into .env.local
npm run dev
```

Open http://localhost:3000.

Test flow:
1. Visit `/` → click "Start Free" → create account.
2. You'll land on `/portal/onboarding`. Drop a logo, pick products,
   preview, publish.
3. Dashboard appears at `/portal/dashboard`.
4. Public storefront is at `/shop/<your-slug>`.

To test paid signups locally you'd need a public webhook tunnel (use
`stripe listen --forward-to localhost:3000/api/webhooks/stripe`).
Easier: deploy first (Step 7) and test there.

---

## STEP 7 — Deploy to Vercel

1. Push this repo to GitHub (this is already done if you're reading from
   the repo).
2. Vercel → Add New → Project → import the repo.
3. **Root Directory** → `portal`.
4. **Environment Variables** — paste every key/value from your
   `.env.local`. **All** of them. Click "Add" for each.
5. Deploy. Get the `*.vercel.app` URL.
6. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to your real URL →
   Redeploy.

### Configure the Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://YOUR-DEPLOYED-URL/api/webhooks/stripe`
3. Events to send (Ctrl+click each):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
4. Save → copy the **Signing secret** (`whsec_...`) → paste into Vercel
   env vars as `STRIPE_WEBHOOK_SECRET` → Redeploy.

Test by completing a Stripe test checkout. Webhook deliveries should
show HTTP 200 in the Stripe dashboard.

---

## STEP 8 — Point a subdomain at the portal

In Vercel project → Settings → Domains → Add
**`merch.willpowerfitnessfactory.com`**. Vercel gives you a CNAME record.

At Namecheap → Advanced DNS → Add CNAME:
- Type: CNAME
- Host: `merch`
- Value: `cname.vercel-dns.com`
- TTL: Automatic

After DNS propagates, update `NEXT_PUBLIC_SITE_URL` to
`https://merch.willpowerfitnessfactory.com` → Redeploy.

---

## STEP 9 — Going live with real Stripe

When you're ready to take real money:

1. Stripe Dashboard → toggle **Live mode**.
2. Re-do Step 2 in live mode (new keys, new prices for Pro & Elite, new
   webhook).
3. Connect → Settings → finish live activation (Stripe will ask for your
   business details, this is the platform's KYC).
4. Update all four Stripe-related env vars in Vercel:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`, `STRIPE_CONNECT_CLIENT_ID`
5. Redeploy.

Run one full live transaction with your own card to verify everything
end-to-end, then refund yourself in Stripe.

---

## How to onboard your first client manually (the safety hatch)

If a client gets stuck during signup, you can complete the onboarding for
them:

1. **Create their auth user** — Supabase dashboard → Authentication →
   Users → Invite. They get an email to set a password.
2. **Create their client row** — SQL editor:
   ```sql
   insert into public.clients (user_id, name, email, business_name, store_slug, store_status)
   values (
     'their_auth_user_id_uuid',
     'Jane Doe',
     'jane@example.com',
     'Concrete Iron Gym',
     'concrete-iron',
     'live'
   );
   ```
3. **Add their products** — for each product they want:
   ```sql
   insert into public.products (client_id, template_key, name, price_cents, base_cost_cents, active)
   values ('the_client_id_from_above', 'tee', 'Classic Tee', 3499, 1100, true);
   ```
4. **Upload their logo** to Cloudinary manually, then:
   ```sql
   update public.clients
   set logo_url = 'https://res.cloudinary.com/...'
   where id = 'the_client_id';
   ```

They'll now see their store at `/shop/concrete-iron` and can manage it
from `/portal/dashboard`.

---

## Architecture quick reference

```
portal/
├── app/
│   ├── page.tsx                  # marketing landing + pricing
│   ├── portal/
│   │   ├── login/, signup/       # auth
│   │   ├── onboarding/page.tsx   # 4-step wizard host
│   │   └── dashboard/            # authed routes
│   │       ├── layout.tsx        # sidebar + auth guard
│   │       ├── page.tsx          # dashboard home
│   │       ├── store/            # branding editor
│   │       ├── products/         # toggle + pricing
│   │       ├── orders/           # orders table
│   │       ├── settings/         # Stripe Connect + domain
│   │       └── billing/          # plan / portal
│   ├── shop/[slug]/              # public-facing per-client storefronts
│   └── api/
│       ├── portal/signup/        # create user + client + (optional) subscribe
│       ├── portal/onboarding/    # save wizard state
│       ├── portal/store/         # PATCH branding
│       ├── portal/products/      # toggle/edit products
│       ├── portal/stripe/connect # Stripe Connect onboarding link
│       ├── portal/billing/portal # Stripe customer billing portal
│       ├── checkout/             # storefront → Stripe Checkout
│       └── webhooks/stripe/      # all Stripe events route through here
├── components/                   # portal/* and storefront/* component sets
├── lib/
│   ├── supabase/ (server, browser, middleware)
│   ├── stripe.ts, printify.ts, cloudinary.ts, resend.ts
│   ├── plans.ts          # tier definitions + fee math
│   ├── product-templates.ts
│   └── slug.ts, types.ts
├── middleware.ts                 # session refresh + route protection
├── supabase/migrations/001_initial.sql
└── .env.example
```

Security model:
- **Supabase RLS** ensures clients can only see their own data.
- **Storefronts** read with the service role on the server side and only
  return rows where `store_status = 'live'`.
- **Admin actions** (toggling product active, editing prices) all go
  through API routes that verify `auth.uid()` matches the client's
  `user_id` via the service-role client before writing.
- **Webhooks** verify Stripe signatures against `STRIPE_WEBHOOK_SECRET`.
- **Service role key** never reaches the browser — only used in
  server-side API routes.

---

## Common issues

**"Signup says 'service role key not set' "**
You didn't paste `SUPABASE_SERVICE_ROLE_KEY` into Vercel. The anon key
alone can't create a `clients` row because the user has no row yet.

**"Stripe Connect link button does nothing"**
Most likely `STRIPE_CONNECT_CLIENT_ID` isn't set, or you haven't
activated Connect on your Stripe account. Open Stripe → Connect →
Settings and complete the platform setup.

**"Customer paid but no Printify order was created"**
Either the client's products don't have `printify_product_id` set yet
(see Step 3), or the variant matching failed because the color/size in
your Printify catalog doesn't match what the customer picked. Check
Vercel function logs for the failing line.

**"Customer paid but client didn't get paid"**
The client hasn't completed Stripe Connect onboarding
(`stripe_account_status` is not `active`). In this case payments go to
**your** Stripe account and you need to manually transfer them to the
client. Prompt the client to finish Connect in Settings.
