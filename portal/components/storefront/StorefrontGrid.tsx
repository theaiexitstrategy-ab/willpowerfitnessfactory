'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import StorefrontModal from './StorefrontModal';

export default function StorefrontGrid({
  products,
  accent,
  slug,
}: {
  products: Product[];
  accent: string;
  slug: string;
}) {
  const [active, setActive] = useState<Product | null>(null);

  if (products.length === 0) {
    return <p className="text-silver text-center py-10">Products coming soon.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px" style={{ background: '#222' }}>
        {products.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setActive(p)}
              className="group w-full text-left p-5 hover:bg-[#111] transition-colors flex flex-col"
              style={{ background: '#0a0a0a' }}
            >
              <div
                className="aspect-square flex items-center justify-center mb-4 transition-colors"
                style={{
                  background: '#0f0f0f',
                  border: `1px solid ${accent}30`,
                }}
              >
                {p.mockup_url ? (
                  <img src={p.mockup_url} alt={p.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-silver text-sm uppercase tracking-widest">{p.name}</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-condensed font-bold uppercase tracking-wide text-base text-white">
                  {p.name}
                </h3>
                <span className="font-condensed font-bold whitespace-nowrap" style={{ color: accent }}>
                  ${(p.price_cents / 100).toFixed(2)}
                </span>
              </div>
              <p className="font-body font-light text-sm text-silver mt-2 leading-relaxed line-clamp-2">
                {p.description || ''}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <StorefrontModal product={active} accent={accent} slug={slug} onClose={() => setActive(null)} />
      )}
    </>
  );
}
