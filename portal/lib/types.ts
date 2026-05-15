export type PlanTier = 'free' | 'pro' | 'elite';

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  business_name: string;
  tagline: string | null;
  logo_url: string | null;
  brand_color: string;
  plan_tier: PlanTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_account_id: string | null;
  stripe_account_status: 'not_connected' | 'pending' | 'active';
  store_slug: string | null;
  store_status: 'draft' | 'live' | 'paused';
  monthly_revenue_cents: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
};

export type ProductTemplateKey =
  | 'tee'
  | 'hoodie'
  | 'snapback'
  | 'tank'
  | 'joggers'
  | 'tumbler'
  | 'shorts'
  | 'zip_hoodie';

export type Product = {
  id: string;
  client_id: string;
  template_key: ProductTemplateKey;
  name: string;
  description: string | null;
  category: string | null;
  printify_product_id: string | null;
  mockup_url: string | null;
  price_cents: number;
  base_cost_cents: number;
  active: boolean;
  created_at: string;
};

export type OrderItem = {
  product_id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price_cents: number;
};

export type Order = {
  id: string;
  client_id: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string;
  shipping_json: Record<string, unknown> | null;
  items_json: OrderItem[];
  subtotal_cents: number;
  shipping_cents: number;
  platform_fee_cents: number;
  total_cents: number;
  stripe_payment_id: string | null;
  printify_order_id: string | null;
  status: 'pending' | 'paid' | 'printing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  tracking_number: string | null;
  tracking_url: string | null;
};
