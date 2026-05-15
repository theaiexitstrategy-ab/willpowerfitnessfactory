import { NextResponse } from 'next/server';
import { supabaseServer, supabaseService } from '@/lib/supabase/server';

export async function PATCH(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof body.businessName === 'string') update.business_name = body.businessName;
  if (typeof body.tagline === 'string') update.tagline = body.tagline || null;
  if (typeof body.logoUrl === 'string' || body.logoUrl === null) update.logo_url = body.logoUrl;
  if (typeof body.brandColor === 'string') update.brand_color = body.brandColor;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const service = supabaseService();
  const { error } = await service.from('clients').update(update).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
