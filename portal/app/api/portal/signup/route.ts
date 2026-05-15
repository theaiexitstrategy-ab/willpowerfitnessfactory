import { NextResponse } from 'next/server';
import { supabaseServer, supabaseService } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { sendWelcomeEmail } from '@/lib/resend';
import { PLANS } from '@/lib/plans';
import type { PlanTier } from '@/lib/types';
import { slugify } from '@/lib/slug';

export async function POST(req: Request) {
  try {
    const { name, businessName, email, password, planTier } = (await req.json()) as {
      name: string;
      businessName: string;
      email: string;
      password: string;
      planTier: PlanTier;
    };

    if (!name || !businessName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const supabase = supabaseServer();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, business_name: businessName } },
    });
    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }
    const userId = signUpData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sign-up did not return a user.' }, { status: 500 });
    }

    let stripeCustomerId: string | null = null;
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const customer = await stripe.customers.create({
          email,
          name,
          metadata: { user_id: userId, business_name: businessName },
        });
        stripeCustomerId = customer.id;
      } catch (err) {
        console.warn('[/api/portal/signup] stripe customer create failed', err);
      }
    }

    const baseSlug = slugify(businessName) || `store-${userId.slice(0, 6)}`;
    const slug = await uniqueSlug(baseSlug);

    const service = supabaseService();
    const { error: insertError } = await service.from('clients').insert({
      user_id: userId,
      name,
      email,
      business_name: businessName,
      plan_tier: planTier,
      stripe_customer_id: stripeCustomerId,
      store_slug: slug,
    });
    if (insertError) {
      console.error('[/api/portal/signup] insert client failed', insertError);
      return NextResponse.json({ error: 'Could not create client record.' }, { status: 500 });
    }

    sendWelcomeEmail({
      to: email,
      businessName,
      storeUrl: `${siteUrl()}/portal/dashboard`,
    }).catch(() => {});

    const plan = PLANS[planTier] || PLANS.free;
    if (plan.tier !== 'free' && plan.stripePriceEnv && stripeCustomerId) {
      const priceId = process.env[plan.stripePriceEnv];
      if (!priceId) {
        return NextResponse.json({
          error: `Stripe price env var ${plan.stripePriceEnv} not set.`,
        }, { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${siteUrl()}/portal/onboarding?subscribed=1`,
        cancel_url: `${siteUrl()}/portal/signup?cancelled=1`,
        metadata: { user_id: userId, plan_tier: planTier },
      });
      return NextResponse.json({ checkoutUrl: session.url });
    }

    return NextResponse.json({ checkoutUrl: null });
  } catch (err) {
    console.error('[/api/portal/signup]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function uniqueSlug(base: string): Promise<string> {
  const service = supabaseService();
  let candidate = base;
  let n = 1;
  while (true) {
    const { data } = await service
      .from('clients')
      .select('id')
      .eq('store_slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) return `${base}-${Date.now().toString(36)}`;
  }
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
