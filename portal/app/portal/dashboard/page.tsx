import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import type { Client, Order, Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  const supabase = supabaseServer();
  const { data: client } = await supabase.from('clients').select('*').single();
  const c = client as Client | null;
  if (!c) return null;

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('*').eq('client_id', c.id).eq('active', true),
  ]);

  const recent = (orders || []) as Order[];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRevenue = recent
    .filter((o) => new Date(o.created_at) >= monthStart && o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_cents - o.platform_fee_cents), 0);

  const allTimeRevenue = recent
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_cents - o.platform_fee_cents), 0);

  const productCounts = new Map<string, number>();
  for (const o of recent) {
    for (const it of o.items_json) {
      productCounts.set(it.name, (productCounts.get(it.name) || 0) + it.quantity);
    }
  }
  const topProduct = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const storeUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || '') + `/shop/${c.store_slug || ''}`;

  return (
    <div className="px-5 py-8 md:py-12 max-w-[1080px]">
      <span className="eyebrow">Owner</span>
      <h1 className="font-display text-[clamp(2.2rem,5vw,3rem)] mt-2 mb-8">DASHBOARD</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="MTD Revenue" value={fmt(monthRevenue)} />
        <Stat label="All Time" value={fmt(allTimeRevenue)} />
        <Stat label="Orders (recent)" value={String(recent.length)} />
        <Stat label="Top Product" value={topProduct} small />
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        <Link href="/portal/dashboard/products" className="btn-gold">+ Add Product</Link>
        <a href={storeUrl} target="_blank" rel="noopener" className="btn-outline">View Store ↗</a>
        <CopyLinkButton url={storeUrl} />
      </div>

      <h2 className="font-display text-2xl tracking-wider mb-4">RECENT ORDERS</h2>
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left">
              <Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th><Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <Td mono>{o.id.slice(0, 8)}</Td>
                <Td>{o.customer_email}</Td>
                <Td>{fmt(o.total_cents)}</Td>
                <Td><StatusBadge status={o.status} /></Td>
                <Td>{new Date(o.created_at).toLocaleDateString()}</Td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-silver">
                  No orders yet. Share your store link to start selling.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  // Plain anchor that copies via clipboard — but next isn't a client comp here,
  // so keep it simple: just show URL on a button. Real copy lives in My Store tab.
  return <span className="text-silver text-xs self-center">Your store: <code className="font-mono">{url}</code></span>;
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="eyebrow">{label}</p>
      <p className={`font-display mt-1 ${small ? 'text-lg truncate' : 'text-3xl'}`}>{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-condensed font-semibold uppercase tracking-widest text-[0.7rem] text-silver px-4 py-3">{children}</th>;
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 ${mono ? 'font-mono text-xs' : ''}`}>{children}</td>;
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const colors: Record<Order['status'], string> = {
    pending: 'text-silver border-border',
    paid: 'text-light border-light/40',
    printing: 'text-gold border-gold/40',
    shipped: 'text-blue-300 border-blue-300/40',
    delivered: 'text-green-400 border-green-400/40',
    cancelled: 'text-red-400 border-red-400/40',
    failed: 'text-red-400 border-red-400/40',
  };
  return (
    <span className={`inline-block px-2 py-0.5 border text-[10px] uppercase tracking-widest font-condensed ${colors[status]}`}>
      {status}
    </span>
  );
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
