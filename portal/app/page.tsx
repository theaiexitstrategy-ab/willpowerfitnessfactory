import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { PLANS } from '@/lib/plans';

export default function LandingPage() {
  return (
    <>
      <PublicNav />
      <main className="pt-[60px]">
        <section className="px-5 py-16 md:py-24 max-w-[1160px] mx-auto">
          <span className="eyebrow">For Gyms · Trainers · Fitness Brands</span>
          <h1 className="font-display text-[clamp(2.8rem,9vw,5.5rem)] mt-3 mb-5">
            LAUNCH YOUR
            <br />
            <span className="text-gold">MERCH STORE.</span>
          </h1>
          <p className="font-body font-light text-light max-w-[52ch] text-lg leading-relaxed mb-8">
            Upload your logo. Pick your products. Set your prices. Your storefront goes live in
            under 10 minutes. We print, ship, and handle the back-end — you collect the margin.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/portal/signup" className="btn-gold">Start Free →</Link>
            <Link href="#how" className="btn-outline">How it works</Link>
          </div>
        </section>

        <section id="how" className="border-y border-border bg-card">
          <div className="max-w-[1160px] mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-4 gap-8">
            <Step n="1" t="Sign up" d="Pick a plan. Subscribe in Stripe (or start free)." />
            <Step n="2" t="Brand it" d="Upload your logo and choose your accent color." />
            <Step n="3" t="Pick products" d="Toggle tees, hoodies, hats. Set your retail prices." />
            <Step n="4" t="Go live" d="Get a shareable store URL. Customers buy. We fulfill." />
          </div>
        </section>

        <section className="px-5 py-16 md:py-24 max-w-[1160px] mx-auto">
          <div className="text-center mb-10">
            <span className="eyebrow">Pricing</span>
            <h2 className="font-display text-[clamp(2.2rem,6vw,3.6rem)] mt-2">PICK YOUR PLAN</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(PLANS).map((plan) => (
              <div
                key={plan.tier}
                className={`panel ${plan.tier === 'pro' ? 'border-gold' : ''}`}
              >
                {plan.tier === 'pro' && (
                  <span className="inline-block bg-gold text-black px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest mb-3">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-3xl">{plan.name.toUpperCase()}</h3>
                <p className="font-condensed text-2xl text-gold mt-1 mb-4">
                  ${(plan.priceCents / 100).toFixed(0)}
                  <span className="text-silver text-base">/mo</span>
                </p>
                <ul className="space-y-2 text-sm text-light mb-6 font-body font-light">
                  {plan.features.map((f) => (
                    <li key={f} className="leading-snug">· {f}</li>
                  ))}
                </ul>
                <Link
                  href={`/portal/signup?plan=${plan.tier}`}
                  className={plan.tier === 'pro' ? 'btn-gold w-full text-center block' : 'btn-outline w-full text-center block'}
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div>
      <p className="font-display text-5xl text-gold/30">{n}</p>
      <h3 className="font-condensed font-bold uppercase tracking-widest text-base mt-1 mb-2">{t}</h3>
      <p className="font-body font-light text-sm text-silver leading-relaxed">{d}</p>
    </div>
  );
}
