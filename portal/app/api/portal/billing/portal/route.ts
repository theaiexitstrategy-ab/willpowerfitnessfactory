import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: client } = await supabase
    .from('clients')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!client?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer on file.' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const session = await stripe.billingPortal.sessions.create({
    customer: client.stripe_customer_id,
    return_url: `${siteUrl}/portal/dashboard/billing`,
  });
  return NextResponse.json({ url: session.url });
}
