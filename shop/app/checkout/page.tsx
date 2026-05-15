import CheckoutForm from '@/components/CheckoutForm';

export const metadata = { title: 'Checkout | Will Power Fitness Factory' };

export default function CheckoutPage() {
  return (
    <section className="px-5 py-12 md:py-16">
      <div className="max-w-[1080px] mx-auto">
        <div className="mb-8">
          <span className="eyebrow">Secure Checkout</span>
          <h1 className="font-display text-[clamp(2.4rem,6vw,3.6rem)] mt-2">FINISH ORDER</h1>
        </div>
        <CheckoutForm />
      </div>
    </section>
  );
}
