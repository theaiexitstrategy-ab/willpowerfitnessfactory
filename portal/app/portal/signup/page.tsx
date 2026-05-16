import PublicNav from '@/components/PublicNav';
import SignupForm from '@/components/portal/SignupForm';
import { PLANS } from '@/lib/plans';
import { BRAND } from '@/lib/brand';
import type { PlanTier } from '@/lib/types';

export const metadata = { title: `Sign up | ${BRAND.name}` };

export default function SignupPage({ searchParams }: { searchParams: { plan?: string } }) {
  const requestedPlan: PlanTier =
    searchParams.plan && (['free', 'pro', 'elite'] as const).includes(searchParams.plan as PlanTier)
      ? (searchParams.plan as PlanTier)
      : 'free';
  const plan = PLANS[requestedPlan];

  return (
    <>
      <PublicNav />
      <section className="pt-[100px] pb-20 px-5">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="panel">
            <span className="eyebrow">Create account</span>
            <h1 className="font-display text-3xl mt-2 mb-6">START YOUR STORE</h1>
            <SignupForm planTier={requestedPlan} />
          </div>
          <aside className="panel">
            <span className="eyebrow">Your plan</span>
            <h2 className="font-display text-2xl mt-1">{plan.name.toUpperCase()}</h2>
            <p className="font-condensed text-3xl text-gold my-2">
              ${(plan.priceCents / 100).toFixed(0)}
              <span className="text-silver text-base">/mo</span>
            </p>
            <ul className="text-sm text-light space-y-1.5 mt-3 font-body">
              {plan.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <p className="text-xs text-silver mt-5 leading-relaxed">
              {plan.tier === 'free'
                ? 'No card required. Upgrade anytime from billing.'
                : 'After account creation you\'ll be redirected to Stripe to complete the subscription. Cancel anytime.'}
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
