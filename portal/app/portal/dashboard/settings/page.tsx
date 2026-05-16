import { supabaseServer } from '@/lib/supabase/server';
import type { Client } from '@/lib/types';
import StripeConnectCard from '@/components/portal/StripeConnectCard';
import { BRAND } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = supabaseServer();
  const { data: client } = await supabase.from('clients').select('*').single();
  const c = client as Client | null;
  if (!c) return null;

  return (
    <div className="px-5 py-8 md:py-12 max-w-[800px] space-y-6">
      <div>
        <span className="eyebrow">Account</span>
        <h1 className="font-display text-[clamp(2rem,5vw,2.8rem)] mt-2 mb-2">SETTINGS</h1>
      </div>

      <StripeConnectCard
        accountId={c.stripe_account_id}
        status={c.stripe_account_status}
      />

      <div className="panel">
        <h2 className="font-display text-xl mb-3">CUSTOM DOMAIN</h2>
        <p className="text-silver text-sm font-body leading-relaxed">
          {c.plan_tier === 'elite' ? (
            <>
              Send your domain DNS team a <code className="font-mono text-light">CNAME</code> record
              pointing your subdomain at <code className="font-mono text-gold">cname.vercel-dns.com</code>.
              Then email us the domain at{' '}
              <a href={`mailto:${BRAND.supportEmail}`} className="text-gold underline">
                {BRAND.supportEmail}
              </a>{' '}
              and we'll attach it within 24 hours.
            </>
          ) : (
            <>
              Custom domains are an <strong className="text-white">Elite</strong> plan feature. Upgrade in{' '}
              <a href="/portal/dashboard/billing" className="text-gold underline">Billing</a> to unlock.
            </>
          )}
        </p>
      </div>

      <div className="panel">
        <h2 className="font-display text-xl mb-3">NOTIFICATIONS</h2>
        <p className="text-silver text-sm font-body leading-relaxed">
          {c.plan_tier === 'free' ? (
            <>Order notifications are a <strong className="text-white">Pro</strong> feature. Upgrade to receive an email for every order.</>
          ) : (
            <>You'll get an email every time a customer places an order, sent to{' '}
              <code className="font-mono text-light">{c.email}</code>.</>
          )}
        </p>
      </div>
    </div>
  );
}
