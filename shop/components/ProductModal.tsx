'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from './CartProvider';
import { KettlebellSVG } from './Logo';

export default function ProductModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { add } = useCart();
  const [color, setColor] = useState(product.colors[0]?.name || '');
  const [size, setSize] = useState(product.sizes[0] || '');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handleAdd() {
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      color,
      size,
      quantity: qty,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0a0a] border border-border w-full max-w-[920px] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square bg-[#0f0f0f] border-b md:border-b-0 md:border-r border-border flex items-center justify-center relative">
            <KettlebellSVG size={140} />
            <span className="absolute top-4 left-4 eyebrow bg-black/70 px-2 py-1">
              Preview · Live product image coming soon
            </span>
          </div>

          <div className="p-6 md:p-8 relative">
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 text-silver hover:text-white text-xl"
            >
              ✕
            </button>

            <span className="eyebrow">{product.category === 'apparel' ? 'Apparel' : 'Accessory'}</span>
            <h2 className="font-display text-3xl md:text-4xl mt-1 mb-1">
              {product.name.toUpperCase()}
            </h2>
            <p className="font-condensed font-bold text-xl text-gold mb-4">
              ${product.price.toFixed(2)}
            </p>
            <p className="font-body font-light text-sm text-silver leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="mb-5">
              <p className="eyebrow mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    className={`px-3 py-1.5 flex items-center gap-2 border ${
                      color === c.name ? 'border-gold text-white' : 'border-border text-silver'
                    } hover:border-gold transition-colors`}
                  >
                    <span
                      className="w-3.5 h-3.5 inline-block border border-border"
                      style={{ background: c.hex }}
                    />
                    <span className="font-condensed uppercase tracking-widest text-xs">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="eyebrow mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[44px] px-3 py-2 border ${
                      size === s ? 'border-gold text-white' : 'border-border text-silver'
                    } hover:border-gold transition-colors font-condensed uppercase tracking-widest text-xs`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <p className="eyebrow">Qty</p>
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease"
                  className="w-8 h-8 hover:bg-card transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  aria-label="Increase"
                  className="w-8 h-8 hover:bg-card transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button onClick={handleAdd} className="w-full btn-gold">
              Add to Cart — ${(product.price * qty).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
