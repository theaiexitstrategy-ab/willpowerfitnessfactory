const BASE = 'https://api.printify.com/v1';

function authHeaders() {
  const key = process.env.PRINTIFY_API_KEY;
  if (!key) throw new Error('PRINTIFY_API_KEY not set');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'User-Agent': 'WPFFShop/1.0',
  };
}

function shopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error('PRINTIFY_SHOP_ID not set');
  return id;
}

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  images: { src: string; is_default?: boolean }[];
  variants: {
    id: number;
    title: string;
    price: number;
    is_enabled: boolean;
    is_available: boolean;
    options: number[];
  }[];
  options: { name: string; values: { id: number; title: string }[] }[];
};

export async function getPrintifyProduct(productId: string): Promise<PrintifyProduct | null> {
  const res = await fetch(`${BASE}/shops/${shopId()}/products/${productId}.json`, {
    headers: authHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return (await res.json()) as PrintifyProduct;
}

export type PrintifyOrderLine = {
  product_id: string;
  variant_id: number;
  quantity: number;
};

export type PrintifyAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
};

export async function createPrintifyOrder(params: {
  externalId: string;
  label?: string;
  lineItems: PrintifyOrderLine[];
  address: PrintifyAddress;
}): Promise<{ id: string; status: string }> {
  const body = {
    external_id: params.externalId,
    label: params.label || `WPFF-${params.externalId.slice(-8)}`,
    line_items: params.lineItems,
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: params.address,
  };

  const res = await fetch(`${BASE}/shops/${shopId()}/orders.json`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify order create failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function submitPrintifyOrderToProduction(orderId: string): Promise<void> {
  const res = await fetch(
    `${BASE}/shops/${shopId()}/orders/${orderId}/send_to_production.json`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify send_to_production failed (${res.status}): ${text}`);
  }
}
