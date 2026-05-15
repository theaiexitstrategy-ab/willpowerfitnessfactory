'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { FREE_SHIPPING_THRESHOLD_CENTS } from '@/lib/stripe';

export default function CartPanel() {
  const { items, open, setOpen, setQty, remove, subtotalCents } = useCart();

  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const qualifiesFreeShipping = remainingForFree === 0 && subtotalCents > 0;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 z-[55] transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0a0a0a] border-l border-border z-[60] transform transition-transform flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-2xl tracking-wider">YOUR CART</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="text-silver hover:text-white text-xl"
          >
            ✕
          </button>
        </header>

        {qualifiesFreeShipping ? (
          <div className="bg-gold text-black px-5 py-2.5 text-center font-condensed font-bold text-xs uppercase tracking-widest">
            ✓ You unlocked free shipping
          </div>
        ) : items.length > 0 ? (
          <div className="bg-card text-silver px-5 py-2.5 text-center font-condensed text-xs uppercase tracking-widest">
            ${(remainingForFree / 100).toFixed(2)} to free shipping
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-silver">
              <p className="font-condensed uppercase tracking-widest text-sm">Cart is empty</p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="mt-4 text-gold font-condensed uppercase tracking-widest text-xs hover:text-gold-hi"
              >
                Shop the drop →
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.color}-${item.size}`}
                  className="flex gap-3 border-b border-border pb-4"
                >
                  <div className="w-20 h-20 bg-card border border-border flex items-center justify-center shrink-0">
                    <KettlebellMini />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed font-bold uppercase tracking-wide text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-silver mt-0.5">
                      {item.color} · {item.size}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease"
                          onClick={() =>
                            setQty(item.productId, item.color, item.size, item.quantity - 1)
                          }
                          className="w-7 h-7 hover:bg-card transition-colors"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm">{item.quantity}</span>
                        <button
                          aria-label="Increase"
                          onClick={() =>
                            setQty(item.productId, item.color, item.size, item.quantity + 1)
                          }
                          className="w-7 h-7 hover:bg-card transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-condensed font-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => remove(item.productId, item.color, item.size)}
                      className="mt-1 text-[10px] text-silver hover:text-white uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border p-5 space-y-3">
            <div className="flex justify-between font-condensed text-sm">
              <span className="text-silver uppercase tracking-widest">Subtotal</span>
              <span className="font-bold text-white">${(subtotalCents / 100).toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="block w-full text-center bg-gold text-black font-condensed font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-opacity"
            >
              Checkout →
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="block w-full text-center text-silver hover:text-white font-condensed uppercase tracking-widest text-xs"
            >
              Keep shopping
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

function KettlebellMini() {
  return (
    <svg viewBox="0 0 32 36" width={36} height={40} fill="none">
      <path d="M8 16 Q8 4 16 4 Q24 4 24 16" stroke="#808080" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="16" cy="26" rx="14" ry="11" fill="#808080" />
      <path d="M19 18 L11 26 L15.5 26 L13 34 L21 24 L16.5 24 Z" fill="#0a0a0a" />
    </svg>
  );
}
