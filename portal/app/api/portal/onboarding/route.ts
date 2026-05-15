import { NextResponse } from 'next/server';
import { supabaseServer, supabaseService } from '@/lib/supabase/server';
import { PRODUCT_TEMPLATES, getTemplate } from '@/lib/product-templates';
import type { ProductTemplateKey } from '@/lib/types';

type Payload = {
  state: {
    businessName: string;
    tagline: string;
    logoUrl: string | null;
    brandColor: string;
    storeSlug: string;
    selectedProducts: Record<ProductTemplateKey, { enabled: boolean; priceCents: number }>;
  };
};

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { state } = (await req.json()) as Payload;
    if (!state?.storeSlug) {
      return NextResponse.json({ error: 'Store slug required' }, { status: 400 });
    }

    const service = supabaseService();

    const { data: client, error: clientErr } = await service
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client record not found' }, { status: 404 });
    }

    const { error: updateErr } = await service
      .from('clients')
      .update({
        business_name: state.businessName,
        tagline: state.tagline || null,
        logo_url: state.logoUrl,
        brand_color: state.brandColor,
        store_slug: state.storeSlug,
        store_status: 'live',
      })
      .eq('id', client.id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const rows = PRODUCT_TEMPLATES.filter((t) => state.selectedProducts[t.key]?.enabled).map(
      (t) => ({
        client_id: client.id,
        template_key: t.key,
        name: t.name,
        description: t.description,
        category: t.category,
        price_cents: state.selectedProducts[t.key].priceCents,
        base_cost_cents: t.baseCostCents,
        active: true,
      }),
    );

    if (rows.length > 0) {
      const { error: upsertErr } = await service
        .from('products')
        .upsert(rows, { onConflict: 'client_id,template_key' });
      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
    }

    await service
      .from('products')
      .update({ active: false })
      .eq('client_id', client.id)
      .not('template_key', 'in', `(${rows.map((r) => `"${r.template_key}"`).join(',') || '""'})`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/portal/onboarding]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
