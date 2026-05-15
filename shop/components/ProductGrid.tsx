'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import ProductModal from './ProductModal';
import { KettlebellSVG } from './Logo';

export default function ProductGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState<Product | null>(null);

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
        {products.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setActive(p)}
              className="group w-full text-left bg-char hover:bg-card transition-colors p-6 flex flex-col h-full"
            >
              <div className="aspect-square bg-[#0f0f0f] border border-border flex items-center justify-center mb-5 group-hover:border-gold/40 transition-colors">
                <KettlebellSVG size={88} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-condensed font-bold uppercase tracking-wide text-base">
                  {p.name}
                </h3>
                <span className="font-condensed font-bold text-gold whitespace-nowrap">
                  ${p.price.toFixed(2)}
                </span>
              </div>
              <p className="font-body font-light text-sm text-silver mt-2 leading-relaxed line-clamp-2">
                {p.description}
              </p>
              <span className="mt-4 inline-block font-condensed font-semibold uppercase tracking-widest text-[0.7rem] text-white group-hover:text-gold transition-colors">
                Quick add →
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active && <ProductModal product={active} onClose={() => setActive(null)} />}
    </>
  );
}
