-- ============================================================
-- GoElev8 Merch Platform — initial schema
-- Apply via: Supabase dashboard → SQL Editor → paste & run.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- clients ----------
create table public.clients (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid unique references auth.users(id) on delete cascade,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  name                      text not null,
  email                     text not null,
  business_name             text not null,
  tagline                   text,

  logo_url                  text,
  brand_color               text default '#C9A84C',

  plan_tier                 text not null default 'free' check (plan_tier in ('free','pro','elite')),
  stripe_customer_id        text,
  stripe_subscription_id    text,
  stripe_account_id         text,
  stripe_account_status     text default 'not_connected'
                              check (stripe_account_status in ('not_connected','pending','active')),

  store_slug                text unique,
  store_status              text not null default 'draft'
                              check (store_status in ('draft','live','paused')),

  monthly_revenue_cents     bigint not null default 0,
  total_orders              integer not null default 0
);

create index clients_user_id_idx on public.clients(user_id);
create index clients_store_slug_idx on public.clients(store_slug);

-- ---------- products ----------
create table public.products (
  id                        uuid primary key default uuid_generate_v4(),
  client_id                 uuid not null references public.clients(id) on delete cascade,
  created_at                timestamptz not null default now(),

  template_key              text not null,
  name                      text not null,
  description               text,
  category                  text,

  printify_product_id       text,
  mockup_url                text,

  price_cents               integer not null,
  base_cost_cents           integer not null,

  active                    boolean not null default true,
  unique (client_id, template_key)
);

create index products_client_id_idx on public.products(client_id);

-- ---------- orders ----------
create table public.orders (
  id                        uuid primary key default uuid_generate_v4(),
  client_id                 uuid not null references public.clients(id) on delete cascade,
  created_at                timestamptz not null default now(),

  customer_name             text,
  customer_email            text not null,
  shipping_json             jsonb,
  items_json                jsonb not null,

  subtotal_cents            integer not null,
  shipping_cents            integer not null default 0,
  platform_fee_cents        integer not null default 0,
  total_cents               integer not null,

  stripe_payment_id         text unique,
  printify_order_id         text,

  status                    text not null default 'pending'
                              check (status in ('pending','paid','printing','shipped','delivered','cancelled','failed')),
  tracking_number           text,
  tracking_url              text
);

create index orders_client_id_idx on public.orders(client_id);
create index orders_status_idx on public.orders(status);

-- ---------- row level security ----------
alter table public.clients   enable row level security;
alter table public.products  enable row level security;
alter table public.orders    enable row level security;

-- clients: a row is readable/writable only by the auth user it belongs to
create policy "clients self read"  on public.clients for select using (user_id = auth.uid());
create policy "clients self write" on public.clients for update using (user_id = auth.uid());
create policy "clients self insert" on public.clients for insert with check (user_id = auth.uid());

-- products: readable/writable by owning client; publicly readable for storefront
create policy "products owner read"   on public.products for select using (
  client_id in (select id from public.clients where user_id = auth.uid())
);
create policy "products owner write"  on public.products for all using (
  client_id in (select id from public.clients where user_id = auth.uid())
);
-- Public can read active products (used by storefront, filtered server-side)
create policy "products public read"  on public.products for select using (active = true);

-- orders: readable only by owning client; writeable by service role only (server-side)
create policy "orders owner read" on public.orders for select using (
  client_id in (select id from public.clients where user_id = auth.uid())
);

-- ---------- triggers ----------
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger clients_touch
  before update on public.clients
  for each row execute function public.touch_updated_at();
