import { supabaseServer } from '@/lib/supabase/server';
import type { Client } from '@/lib/types';
import { PLANS } from '@/lib/plans';
import BillingActions from '@/components/portal/BillingActions';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = supabaseServer();
  const { data: client } = await supabase.from('clients').select('*').single();
  const c = client as Client | null;
  if (!c) return null;
  const plan = PLANS[c.plan_tier];

  return (
    <div className="px-5 py-8 md:py-12 max-w-[1000px]">
      <span className="eyebrow">Subscription</span>
      <h1 className="font-display text-[clamp(2rem,5vw,2.8rem)] mt-2 mb-6">BILLING</h1>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <div className="panel">
          <span className="eyebrow">Current plan</span>
          <h2 className="font-display text-3xl mt-1">{plan.name.toUpperCase()}</h2>
          <p className="font-condensed text-2xl text-gold mt-1">
            ${(plan.priceCents / 100).toFixed(0)}<span className="text-silver text-base">/mo</span>
          </p>
          <ul className="space-y-1.5 text-sm text-light mt-4 font-body">
            {plan.features.map((f) => (
              <li key={f} className="leading-snug">· {f}</li>
            ))}
          </ul>
          {c.stripe_subscription_id && (
            <BillingActions stripeSubscriptionId={c.stripe_subscription_id} />
          )}
        </div>

        <div className="panel space-y-3">
          <h3 className="font-display text-xl">UPGRADE</h3>
          {Object.values(PLANS)
            .filter((p) => p.tier !== c.plan_tier)
            .map((p) => (
              <a
                key={p.tier}
                href={`/portal/signup?plan=${p.tier}`}
                className="block border border-border hover:border-gold p-3 transition-colors"
              >
                <p className="font-condensed font-bold uppercase tracking-wide text-sm">{p.name}</p>
                <p className="text-gold text-xs">${(p.priceCents / 100).toFixed(0)}/mo · {p.platformFeeBps / 100}% fee</p>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}
