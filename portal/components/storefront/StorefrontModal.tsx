'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export default function StorefrontModal({
  product,
  accent,
  slug,
  onClose,
}: {
  product: Product;
  accent: string;
  slug: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          items: [{
            product_id: product.id,
            name: product.name,
            size,
            color,
            quantity: qty,
            price_cents: product.price_cents,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start checkout');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[760px] max-h-[92vh] overflow-y-auto"
        style={{ background: '#0a0a0a', border: `1px solid ${accent}33` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div
            className="aspect-square flex items-center justify-center"
            style={{ background: '#0f0f0f', borderRight: `1px solid ${accent}33` }}
          >
            {product.mockup_url ? (
              <img src={product.mockup_url} alt={product.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-silver text-sm uppercase tracking-widest">{product.name}</span>
            )}
          </div>

          <div className="p-6 md:p-8 relative">
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 text-silver hover:text-white text-xl"
            >
              ✕
            </button>
            <h2 className="font-display text-3xl">{product.name.toUpperCase()}</h2>
            <p className="font-condensed font-bold text-xl mt-1 mb-4" style={{ color: accent }}>
              ${(product.price_cents / 100).toFixed(2)}
            </p>
            <p className="text-silver text-sm font-body leading-relaxed mb-5">{product.description}</p>

            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-silver font-condensed mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className="min-w-[44px] px-3 py-2 font-condensed uppercase tracking-widest text-xs"
                    style={{
                      border: size === s ? `1px solid ${accent}` : '1px solid #2a2a2a',
                      color: size === s ? '#fff' : '#808080',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <p className="text-[10px] uppercase tracking-widest text-silver font-condensed">Qty</p>
              <div className="flex items-center border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 hover:bg-card">−</button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-8 h-8 hover:bg-card">+</button>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs uppercase tracking-widest font-condensed mb-2">{error}</p>}

            <button
              onClick={checkout}
              disabled={busy}
              className="w-full font-condensed font-bold uppercase tracking-widest text-sm py-3.5 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: accent, color: '#000' }}
            >
              {busy ? 'Loading…' : `Checkout — $${((product.price_cents * qty) / 100).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
