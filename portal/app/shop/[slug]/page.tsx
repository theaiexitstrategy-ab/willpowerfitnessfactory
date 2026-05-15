import { notFound } from 'next/navigation';
import { supabaseService } from '@/lib/supabase/server';
import type { Client, Product } from '@/lib/types';
import StorefrontGrid from '@/components/storefront/StorefrontGrid';
import { PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const service = supabaseService();
  const { data: client } = await service
    .from('clients')
    .select('business_name, tagline')
    .eq('store_slug', params.slug)
    .eq('store_status', 'live')
    .maybeSingle();
  return {
    title: client ? `${client.business_name} | Shop` : 'Shop',
    description: client?.tagline || undefined,
  };
}

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const service = supabaseService();
  const { data: client } = await service
    .from('clients')
    .select('*')
    .eq('store_slug', params.slug)
    .eq('store_status', 'live')
    .maybeSingle();
  if (!client) notFound();
  const c = client as Client;

  const { data: products } = await service
    .from('products')
    .select('*')
    .eq('client_id', c.id)
    .eq('active', true)
    .order('created_at');

  const plan = PLANS[c.plan_tier];
  const accent = c.brand_color || '#C9A84C';

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <header
        className="px-5 py-4 flex items-center justify-between border-b"
        style={{ borderColor: '#222' }}
      >
        <a href={`/shop/${c.store_slug}`} className="flex items-center gap-3">
          {c.logo_url ? (
            <img src={c.logo_url} alt={c.business_name} className="h-9 max-w-[200px] object-contain" />
          ) : (
            <span className="font-display text-2xl text-white">{c.business_name.toUpperCase()}</span>
          )}
        </a>
      </header>

      <section className="px-5 py-14 text-center" style={{ borderBottom: `1px solid ${accent}22` }}>
        <h1
          className="font-display text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.95]"
          style={{ color: accent }}
        >
          {c.business_name.toUpperCase()}
        </h1>
        {c.tagline && (
          <p className="font-body font-light text-light text-base md:text-lg max-w-[50ch] mx-auto mt-4 leading-relaxed">
            {c.tagline}
          </p>
        )}
      </section>

      <main className="px-5 py-12 max-w-[1160px] mx-auto">
        <StorefrontGrid
          products={(products || []) as Product[]}
          accent={accent}
          slug={c.store_slug || ''}
        />
      </main>

      <footer
        className="px-5 py-6 text-center text-xs"
        style={{ borderTop: '1px solid #222' }}
      >
        <p className="text-silver">
          © {new Date().getFullYear()} {c.business_name}. All rights reserved.
        </p>
        {!plan.whiteLabel && (
          <p className="text-silver mt-2 text-[11px]">
            Powered by{' '}
            <a
              href="https://willpowerfitnessfactory.com"
              target="_blank"
              rel="noopener"
              className="hover:text-white transition-colors"
            >
              WillPower Fitness Factory
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}
