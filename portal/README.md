# GoElev8 Merch Platform

A self-service portal where fitness brands, gyms, and trainers sign up,
upload their logo, pick products, and launch their own merch storefront
in under 10 minutes. **GoElev8** hosts the platform, takes a percentage
of every order via Stripe's platform fee mechanism, and clients receive
their payouts directly via their own Stripe Connect accounts.

Intended deployment URL: **`shop.goelev8.ai`**.

The platform is fully white-labelable. All visible brand identity
(name, logo, support email, "powered by" credit, marketing URL) is
controlled by environment variables — see `lib/brand.ts` and
`.env.example`. To re-skin for a partner platform, change env vars,
redeploy.

> The codebase lives in this repo (`willpowerfitnessfactory`) for
> historical reasons. It does not depend on Will Power Fitness Factory in
> any way — Will Power is just one of the businesses that will sign up
> as a client of the platform.

---

## What this app does

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT (business owner) SIDE                                        │
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
│  CUSTOMER (end-buyer) SIDE                                           │
│  /shop/[slug]               → that client's storefront               │
│  /shop/[slug]/success       → post-checkout confirmation             │
└─────────────────────────────────────────────────────────────────────┘
```

When a customer pays, Stripe holds the funds, splits a platform fee to
GoElev8 and the remainder to the client's connected Stripe account,
fires a webhook → our server creates a Printify order → Printify prints
+ ships.

---

## What's NOT in this build (deferred to Phase 2B)

Read this carefully so you don't promise features that aren't here yet.

- **Live analytics charts** — the dashboard shows numbers in tables. No
  line/bar charts yet.
- **Automatic Printify product creation from uploaded logos** — you (the
  platform operator) still need to create each client's products in the
  GoElev8 Printify dashboard and paste their `printify_product_id` into
  the products table.
- **Custom domain UI for Elite clients** — Settings shows manual
  instructions; you attach domains in Vercel by hand for now.
- **Per-order email notification toggle** — Pro and Elite clients get
  every-order emails automatically; no opt-out UI yet.
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
4. Authentication → Providers → leave "Email" enabled. **Disable
   "Confirm email"** during early launch (faster signup); re-enable for
   production if you want stricter signups.

---

## STEP 2 — Stripe (subscriptions + Connect)

This is the most involved step because you're standing up GoElev8 as a
Stripe **platform** that hosts other businesses' Stripe accounts.

1. Sign up at https://stripe.com. Stay in **Test Mode** until launch.
2. Settings → API keys → copy `pk_test_...` and `sk_test_...`.
3. Create the two recurring subscription products:
   - **Products → Add product → "GoElev8 Merch Pro"**
     - Recurring, **$29.00 USD / month**
     - After save, copy the price ID (`price_...`) → `STRIPE_PRICE_PRO`
   - **Products → Add product → "GoElev8 Merch Elite"**
     - Recurring, **$79.00 USD / month**
     - Price ID → `STRIPE_PRICE_ELITE`
4. **Connect** → Settings (https://dashboard.stripe.com/test/settings/connect)
   - Platform name: "GoElev8 Merch"
   - Branding: upload the GoElev8 logo, set accent color
   - Enable "Stripe-hosted onboarding"
   - Copy the **client ID** (`ca_...`) → `STRIPE_CONNECT_CLIENT_ID`
5. **Customer portal** — Settings → Billing → Customer portal → activate
   the test mode portal. Allow customers to cancel and update payment
   method.

You'll add the webhook signing secret after deploying (Step 7).

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

When a client toggles a product on in their portal, we save it to our
DB with a base cost and retail price, but we **don't** create a Printify
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
**won't** be sent to Printify automatically (the payment still goes
through and the order is captured in Stripe + DB; you can fulfill
manually).

> Roadmap: Phase 2B will use Printify's product API to create these
> automatically when the client uploads their logo. Until then, plan
> ~10 minutes per new client to set up their 5–8 products.

---

## STEP 4 — Cloudinary

1. Sign up at https://cloudinary.com (free tier is fine).
2. Dashboard → top section → copy the **cloud name**, then click
   "Account Details" to reveal the full `cloudinary://...` URL.
3. Settings → **Upload** → Add upload preset:
   - Preset name: `goelev8_portal` (or whatever)
   - Signing mode: **Unsigned**
   - Folder: `goelev8/clients` (so all logos land in one place)
   - Allowed formats: `png, jpg, jpeg, webp, svg`
   - Save
4. Paste into `.env.local`:
   - `CLOUDINARY_URL=cloudinary://...`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name>`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=goelev8_portal`

---

## STEP 5 — Resend (transactional email)

1. Sign up at https://resend.com.
2. Add domain `goelev8.ai` → follow Resend's DNS instructions (add the
   TXT records to your domain DNS).
3. API Keys → Create → copy → `RESEND_API_KEY`.
4. Set `RESEND_FROM_EMAIL=hello@goelev8.ai` (must be on the verified
   domain).

If you skip this, signup and orders still work — clients just won't get
emails.

---

## STEP 6 — Brand identity (optional, white-label only)

If you want to override the GoElev8 branding (for a partner deployment),
set any of these env vars. Anything left blank uses the defaults baked
into `lib/brand.ts`:

```
NEXT_PUBLIC_BRAND_NAME=Partner Merch
NEXT_PUBLIC_BRAND_SHORT_NAME=Partner
NEXT_PUBLIC_BRAND_TAGLINE=Build your store in 10 minutes.
NEXT_PUBLIC_BRAND_LOGO_URL=https://partner.example.com/logo.png
NEXT_PUBLIC_BRAND_MARKETING_URL=https://partner.example.com
NEXT_PUBLIC_SUPPORT_EMAIL=hello@partner.example.com
NEXT_PUBLIC_BRAND_ORDER_PREFIX=PRTN
```

If you're deploying GoElev8 itself, leave all of these blank.

---

## STEP 7 — Local development

```bash
cd portal
npm install
cp .env.example .env.local
# paste all the values from Steps 1–5 into .env.local
npm run dev
```

You need Node.js 18.18+ installed.

Open http://localhost:3000.

Test flow:
1. Visit `/` → click "Start Free" → create account.
2. You'll land on `/portal/onboarding`. Drop a logo, pick products,
   preview, publish.
3. Dashboard appears at `/portal/dashboard`.
4. Public storefront is at `/shop/<your-slug>`.

To test paid signups locally, use Stripe's CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Easier: deploy first (Step 8) and test there.

---

## STEP 8 — Deploy to Vercel

1. Push this repo to GitHub (already done).
2. Vercel → Add New → Project → import the repo.
3. **Root Directory** → `portal`.
4. **Environment Variables** — paste every key/value from your
   `.env.local`. **All** of them.
5. Deploy. Get the `*.vercel.app` URL.
6. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to your real URL →
   Redeploy.

### Configure the Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://YOUR-DEPLOYED-URL/api/webhooks/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
4. Save → copy the **Signing secret** (`whsec_...`) → paste into Vercel
   env vars as `STRIPE_WEBHOOK_SECRET` → Redeploy.

Test by completing a Stripe test checkout. Deliveries should show
HTTP 200 in the Stripe dashboard.

---

## STEP 9 — Point `shop.goelev8.ai` at the portal

In Vercel project → Settings → Domains → Add **`shop.goelev8.ai`**.
Vercel gives you a CNAME record.

At your DNS host (wherever `goelev8.ai` is managed) → add CNAME:
- Type: CNAME
- Host: `shop`
- Value: `cname.vercel-dns.com`
- TTL: Automatic

After DNS propagates (usually <30 min, SSL cert auto-issues), update
`NEXT_PUBLIC_SITE_URL` to `https://shop.goelev8.ai` → Redeploy.

---

## STEP 10 — Going live with real money

When you're ready to take real payments:

1. Stripe Dashboard → toggle **Live mode**.
2. Re-do Step 2 in live mode (new keys, new prices for Pro & Elite, new
   webhook).
3. Connect → Settings → finish live activation (Stripe will ask for
   GoElev8's business details — this is the **platform's** KYC).
4. Update all Stripe-related env vars in Vercel:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`, `STRIPE_CONNECT_CLIENT_ID`
5. Redeploy.

Run one full live transaction with your own card to verify everything
end-to-end, then refund yourself in Stripe.

---

## How to onboard a client manually (safety hatch)

If a client gets stuck during signup, you can complete the onboarding
for them:

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
from `/portal/dashboard` after logging in.

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
│   │       ├── store/, products/, orders/, settings/, billing/
│   ├── shop/[slug]/              # public per-client storefronts
│   └── api/
│       ├── portal/signup,onboarding,store,products,stripe/connect,billing/portal
│       ├── checkout/             # storefront → Stripe Checkout
│       └── webhooks/stripe/      # all Stripe events
├── components/                   # portal/* and storefront/* sets
├── lib/
│   ├── brand.ts                  # ⭐ EDIT TO RE-SKIN PLATFORM
│   ├── supabase/                 # server, browser, middleware clients
│   ├── stripe.ts, printify.ts, cloudinary.ts, resend.ts
│   ├── plans.ts                  # tier definitions + fee math
│   ├── product-templates.ts
│   └── slug.ts, types.ts
├── middleware.ts                 # session refresh + route protection
├── supabase/migrations/001_initial.sql
└── .env.example
```

Security model:
- **Supabase RLS** ensures clients can only see their own data.
- **Storefronts** read via the service role on the server and only
  return rows where `store_status = 'live'`.
- **Admin actions** verify `auth.uid()` matches `clients.user_id` via
  the service-role client before writing.
- **Webhooks** verify Stripe signatures against `STRIPE_WEBHOOK_SECRET`.
- **Service role key** never reaches the browser — only used in
  server-side route handlers.

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
**GoElev8's** Stripe account and you need to manually transfer them to
the client. Prompt the client to finish Connect in Settings.
