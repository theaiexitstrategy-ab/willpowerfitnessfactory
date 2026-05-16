import { BRAND } from './brand';

const BASE = 'https://api.printify.com/v1';

function authHeaders() {
  const key = process.env.PRINTIFY_API_KEY;
  if (!key) throw new Error('PRINTIFY_API_KEY not set');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'User-Agent': `${BRAND.shortName}Portal/1.0`,
  };
}

function shopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error('PRINTIFY_SHOP_ID not set');
  return id;
}

export type PrintifyMockup = { src: string; is_default?: boolean };

export async function getPrintifyProduct(productId: string): Promise<{
  id: string;
  title: string;
  images: PrintifyMockup[];
  variants: { id: number; price: number; is_enabled: boolean; is_available: boolean; options: number[] }[];
  options: { name: string; values: { id: number; title: string }[] }[];
} | null> {
  const res = await fetch(`${BASE}/shops/${shopId()}/products/${productId}.json`, {
    headers: authHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Submit a Printify order for production.
 *
 * Note: in the shared-shop multi-tenant model, every order goes to the
 * platform-owned Printify account. We tag with client_id in the external_id
 * so the operator can trace orders back to the client.
 */
export async function createPrintifyOrder(params: {
  externalId: string;
  label?: string;
  lineItems: { product_id: string; variant_id: number; quantity: number }[];
  address: {
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
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${BASE}/shops/${shopId()}/orders.json`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      external_id: params.externalId,
      label: params.label || `${BRAND.orderLabelPrefix}-${params.externalId.slice(-8)}`,
      line_items: params.lineItems,
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: params.address,
    }),
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
