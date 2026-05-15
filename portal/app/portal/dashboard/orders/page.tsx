import { supabaseServer } from '@/lib/supabase/server';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'text-silver border-border',
  paid: 'text-light border-light/40',
  printing: 'text-gold border-gold/40',
  shipped: 'text-blue-300 border-blue-300/40',
  delivered: 'text-green-400 border-green-400/40',
  cancelled: 'text-red-400 border-red-400/40',
  failed: 'text-red-400 border-red-400/40',
};

export default async function OrdersPage() {
  const supabase = supabaseServer();
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  const list = (orders || []) as Order[];

  return (
    <div className="px-5 py-8 md:py-12 max-w-[1080px]">
      <span className="eyebrow">Fulfillment</span>
      <h1 className="font-display text-[clamp(2rem,5vw,2.8rem)] mt-2 mb-6">ORDERS</h1>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left">
              <th className="px-4 py-3 font-condensed text-[0.7rem] uppercase tracking-widest text-silver">Order</th>
              <th className="px-4 py-3 font-condensed text-[0.7rem] uppercase tracking-widest text-silver">Customer</th>
              <th className="px-4 py-3 font-condensed text-[0.7rem] uppercase tracking-widest text-silver">Items</th>
              <th className="px-4 py-3 font-condensed text-[0.7rem] uppercase tracking-widest text-silver">Total</th>
              <th className="px-4 py-3 font-condensed text-[0.7rem] uppercase tracking-widest text-silver">Status</th>
              <th className="px-4 py-3 font-condensed text-[0.7rem] uppercase tracking-widest text-silver">Tracking</th>
              <th className="px-4 py-3 font-condensed text-[0.7rem] uppercase tracking-widest text-silver">Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-t border-border align-top">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3">
                  <p className="text-sm">{o.customer_name || '—'}</p>
                  <p className="text-xs text-silver">{o.customer_email}</p>
                </td>
                <td className="px-4 py-3 text-xs text-light">
                  {o.items_json.map((i) => (
                    <div key={`${i.product_id}-${i.size}-${i.color}`}>
                      {i.quantity}× {i.name} <span className="text-silver">({i.color}, {i.size})</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 font-condensed font-bold">
                  ${(o.total_cents / 100).toFixed(2)}
                  <p className="text-[10px] text-silver">fee ${(o.platform_fee_cents / 100).toFixed(2)}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 border text-[10px] uppercase tracking-widest font-condensed ${STATUS_COLORS[o.status]}`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {o.tracking_url ? (
                    <a href={o.tracking_url} target="_blank" rel="noopener" className="text-gold hover:underline">
                      Track ↗
                    </a>
                  ) : o.tracking_number ? (
                    <code className="font-mono text-light">{o.tracking_number}</code>
                  ) : (
                    <span className="text-silver">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-silver">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-silver">No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
