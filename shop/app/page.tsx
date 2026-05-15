import Link from 'next/link';
import { KettlebellSVG } from '@/components/Logo';

const BOOK = 'https://book.willpowerfitnessfactory.com';
const SITE = 'https://willpowerfitnessfactory.com';

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[88vh] flex flex-col justify-end overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${SITE}/5X0A1947.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'grayscale(40%) brightness(0.55) contrast(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black" />

        <div className="relative z-10 px-5 pb-10 max-w-[1160px] mx-auto w-full">
          <span className="eyebrow">St. Louis Personal Trainer · Pro Bodybuilder</span>
          <h1 className="font-display text-[clamp(4rem,16vw,7.5rem)] leading-[0.88] mt-3 mb-4">
            BODY.
            <br />
            MIND.
            <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: '1.5px #f2f2f2' }}
            >
              WILL.
            </span>
          </h1>
          <p className="font-body font-light text-light max-w-[40ch] mb-6 leading-relaxed">
            Official merch from Will Power Fitness Factory — built like the training. Shop the drop.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="btn-gold">
              Shop the Drop →
            </Link>
            <a href={BOOK} className="btn-outline">
              Book a Session
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="max-w-[1160px] mx-auto px-5 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature
            title="Built Like Training"
            body="Heavy fabrics. Real stitching. Apparel that earns its place in the gym bag."
          />
          <Feature
            title="Pro Bodybuilder Approved"
            body="Every piece tested by William Anderson, WNBF Pro. If it doesn't survive the floor, it doesn't ship."
          />
          <Feature
            title="Free Shipping $75+"
            body="Two pieces and you're there. Orders under print and ship from our partner facility."
          />
        </div>
      </section>

      <section className="py-16 px-5">
        <div className="max-w-[1160px] mx-auto text-center">
          <div className="inline-block mb-6">
            <KettlebellSVG size={56} />
          </div>
          <h2 className="font-display text-[clamp(2.4rem,8vw,4rem)] mb-4">SHOP THE DROP</h2>
          <p className="font-body font-light text-silver max-w-[44ch] mx-auto mb-8 leading-relaxed">
            Tees, hoodies, joggers, hats, and the tumbler that gets dropped at every PR attempt.
            Limited print runs — once they sell, they're gone until the next drop.
          </p>
          <Link href="/shop" className="btn-gold">
            See the Collection →
          </Link>
        </div>
      </section>
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-condensed font-bold uppercase tracking-widest text-base text-white mb-2">
        {title}
      </h3>
      <p className="font-body font-light text-sm text-silver leading-relaxed">{body}</p>
    </div>
  );
}
