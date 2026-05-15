import { NextResponse } from 'next/server';
import { supabaseServer, supabaseService } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

/**
 * Start the Stripe Connect onboarding for the signed-in client.
 *
 * We create an Express account on first request, persist its id, then return
 * a Stripe-hosted onboarding link. After the client finishes (or refreshes
 * later), Stripe calls our webhook with account.updated.
 */
export async function POST() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const service = supabaseService();
  const { data: client } = await service
    .from('clients')
    .select('id, email, stripe_account_id, stripe_account_status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  let accountId = client.stripe_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: client.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_type: 'individual',
      metadata: { client_id: client.id },
    });
    accountId = account.id;
    await service
      .from('clients')
      .update({ stripe_account_id: accountId, stripe_account_status: 'pending' })
      .eq('id', client.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/portal/dashboard/settings`,
    return_url: `${siteUrl}/portal/dashboard/settings?stripe=connected`,
    type: 'account_onboarding',
  });
  return NextResponse.json({ url: link.url });
}
