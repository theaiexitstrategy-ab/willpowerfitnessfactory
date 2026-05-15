import ProductGrid from '@/components/ProductGrid';
import { PRODUCTS } from '@/lib/products';

export const metadata = { title: 'Shop | Will Power Fitness Factory' };

export default function ShopPage() {
  return (
    <>
      <div className="bg-gold text-black text-center py-2.5 font-condensed font-bold uppercase text-xs tracking-widest">
        Free shipping on orders $75+
      </div>

      <section className="px-5 py-12 md:py-16">
        <div className="max-w-[1160px] mx-auto">
          <div className="mb-10">
            <span className="eyebrow">Official Merch · Limited Run</span>
            <h1 className="font-display text-[clamp(2.6rem,7vw,4rem)] mt-2">SHOP THE DROP</h1>
            <p className="font-body font-light text-silver max-w-[52ch] mt-3 leading-relaxed">
              Apparel and gear from Will Power Fitness Factory. Built for the floor. Designed for everywhere else.
            </p>
          </div>
          <ProductGrid products={PRODUCTS} />
        </div>
      </section>
    </>
  );
}
