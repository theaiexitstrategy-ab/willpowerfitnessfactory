import { stripe } from '@/lib/stripe';
import { isAdminAuthed } from '@/lib/admin-auth';
import LoginForm from './login-form';

export const metadata = { title: 'Admin | Will Power Fitness Factory' };
export const dynamic = 'force-dynamic';

type ItemSummary = { id: string; name: string };

export default async function AdminPage() {
  if (!isAdminAuthed()) {
    return (
      <section className="px-5 py-16 min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-[420px] border border-border bg-card p-8">
          <span className="eyebrow">Restricted</span>
          <h1 className="font-display text-3xl mt-2 mb-6">ADMIN ACCESS</h1>
          <LoginForm />
        </div>
      </section>
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return (
      <Wrapper>
        <p className="text-light">STRIPE_SECRET_KEY not set — can't show orders.</p>
      </Wrapper>
    );
  }

  const pis = await stripe.paymentIntents.list({ limit: 100 });
  const succeeded = pis.data.filter((p) => p.status === 'succeeded');

  const revenueCents = succeeded.reduce((sum, p) => sum + p.amount, 0);
  const orderCount = succeeded.length;
  const avgCents = orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;

  const productCounts = new Map<string, number>();
  for (const p of succeeded) {
    try {
      const items: ItemSummary[] = JSON.parse(p.metadata.items_json || '[]').map((i: any) => ({
        id: i.id,
        name: i.n,
      }));
      for (const it of items) {
        productCounts.set(it.name, (productCounts.get(it.name) || 0) + 1);
      }
    } catch {}
  }
  const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Wrapper>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Revenue" value={`$${(revenueCents / 100).toFixed(2)}`} />
        <Stat label="Orders" value={String(orderCount)} />
        <Stat label="Avg Order" value={`$${(avgCents / 100).toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <h2 className="font-display text-2xl tracking-wider mb-4">RECENT ORDERS</h2>
          <div className="border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card">
                <tr className="text-left">
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Total</Th>
                  <Th>Fulfilled</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {succeeded.slice(0, 30).map((p) => {
                  const orderNumber = p.metadata.order_number || p.id.slice(-8).toUpperCase();
                  const printifyOk = p.metadata.printify_order_id && p.metadata.printify_order_id !== 'none';
                  return (
                    <tr key={p.id} className="border-t border-border">
                      <Td mono>{orderNumber}</Td>
                      <Td>{p.receipt_email || '—'}</Td>
                      <Td>${(p.amount / 100).toFixed(2)}</Td>
                      <Td>
                        {printifyOk ? (
                          <span className="text-gold">Printify ✓</span>
                        ) : p.metadata.fulfilled_at ? (
                          <span className="text-silver">Skipped</span>
                        ) : (
                          <span className="text-silver">Pending</span>
                        )}
                      </Td>
                      <Td>{new Date(p.created * 1000).toLocaleDateString()}</Td>
                    </tr>
                  );
                })}
                {succeeded.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-silver">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          <h2 className="font-display text-2xl tracking-wider mb-4">TOP PRODUCTS</h2>
          <div className="border border-border bg-card p-4">
            {topProducts.length === 0 ? (
              <p className="text-silver text-sm">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {topProducts.map(([name, count]) => (
                  <li key={name} className="flex justify-between text-sm">
                    <span className="text-light truncate pr-2">{name}</span>
                    <span className="text-gold font-bold whitespace-nowrap">×{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form action="/api/admin/logout" method="POST" className="mt-6">
            <button
              type="submit"
              className="text-silver hover:text-white font-condensed uppercase tracking-widest text-xs"
            >
              Sign out
            </button>
          </form>
        </aside>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-5 py-12 md:py-16">
      <div className="max-w-[1160px] mx-auto">
        <div className="mb-8">
          <span className="eyebrow">Owner</span>
          <h1 className="font-display text-[clamp(2.4rem,6vw,3.6rem)] mt-2">DASHBOARD</h1>
        </div>
        {children}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p className="font-display text-4xl mt-2">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-condensed font-semibold uppercase tracking-widest text-[0.7rem] text-silver px-4 py-3">
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 ${mono ? 'font-mono text-xs' : ''}`}>{children}</td>;
}
