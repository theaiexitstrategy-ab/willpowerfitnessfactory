import { NextResponse } from 'next/server';
import { supabaseServer, supabaseService } from '@/lib/supabase/server';
import { getTemplate } from '@/lib/product-templates';
import { PLANS } from '@/lib/plans';
import type { ProductTemplateKey } from '@/lib/types';

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await req.json()) as {
    template_key: ProductTemplateKey;
    active?: boolean;
    priceCents?: number;
    create?: boolean;
  };

  const template = getTemplate(body.template_key);
  if (!template) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

  const service = supabaseService();
  const { data: client } = await service
    .from('clients')
    .select('id, plan_tier')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  if (body.active) {
    const { count } = await service
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('active', true);
    const limit = PLANS[client.plan_tier as 'free' | 'pro' | 'elite'].productLimit;
    if (Number.isFinite(limit) && (count ?? 0) >= limit) {
      return NextResponse.json({ error: 'Plan product limit reached. Upgrade in Billing.' }, { status: 400 });
    }
  }

  const update: Record<string, unknown> = {};
  if (typeof body.active === 'boolean') update.active = body.active;
  if (typeof body.priceCents === 'number') update.price_cents = body.priceCents;

  if (body.create) {
    const { error } = await service.from('products').upsert(
      {
        client_id: client.id,
        template_key: body.template_key,
        name: template.name,
        description: template.description,
        category: template.category,
        price_cents: body.priceCents ?? template.defaultPriceCents,
        base_cost_cents: template.baseCostCents,
        active: body.active ?? true,
      },
      { onConflict: 'client_id,template_key' },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await service
      .from('products')
      .update(update)
      .eq('client_id', client.id)
      .eq('template_key', body.template_key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
