'use client';

import Link from 'next/link';
import { useState } from 'react';
import Logo from './Logo';
import { useCart } from './CartProvider';

const SITE = 'https://willpowerfitnessfactory.com';
const BOOK = 'https://book.willpowerfitnessfactory.com';

export default function Nav() {
  const { items, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-[60px] bg-black/95 backdrop-blur-md border-b border-border flex items-center justify-between px-5 md:px-6">
      <Link href="/" className="inline-flex items-center" aria-label="Will Power Fitness Factory">
        <Logo height={32} />
      </Link>

      <ul className="hidden md:flex items-center gap-7">
        <li>
          <a href={`${SITE}/#programs`} className="font-condensed font-medium text-xs uppercase tracking-widest text-silver hover:text-white transition-colors">
            Programs
          </a>
        </li>
        <li>
          <a href={`${SITE}/#about`} className="font-condensed font-medium text-xs uppercase tracking-widest text-silver hover:text-white transition-colors">
            About
          </a>
        </li>
        <li>
          <Link href="/shop" className="font-condensed font-medium text-xs uppercase tracking-widest text-white hover:text-gold transition-colors">
            Shop
          </Link>
        </li>
        <li>
          <a href={`${SITE}/#contact`} className="font-condensed font-medium text-xs uppercase tracking-widest text-silver hover:text-white transition-colors">
            Contact
          </a>
        </li>
      </ul>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open cart"
          className="relative font-condensed font-bold text-xs uppercase tracking-widest text-white hover:text-gold transition-colors"
        >
          Cart
          {count > 0 && (
            <span className="absolute -top-2 -right-4 bg-gold text-black text-[10px] font-bold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">
              {count}
            </span>
          )}
        </button>
        <a
          href={BOOK}
          className="hidden sm:inline-block bg-white text-black font-condensed font-bold uppercase text-xs tracking-widest px-4 py-2 hover:opacity-90 transition-opacity"
        >
          Book Now
        </a>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-[60px] inset-x-0 bg-black border-b border-border md:hidden">
          <ul className="flex flex-col p-5 gap-4">
            <li>
              <a href={`${SITE}/#programs`} className="font-condensed uppercase tracking-widest text-sm text-light">
                Programs
              </a>
            </li>
            <li>
              <a href={`${SITE}/#about`} className="font-condensed uppercase tracking-widest text-sm text-light">
                About
              </a>
            </li>
            <li>
              <Link href="/shop" className="font-condensed uppercase tracking-widest text-sm text-white">
                Shop
              </Link>
            </li>
            <li>
              <a href={`${SITE}/#contact`} className="font-condensed uppercase tracking-widest text-sm text-light">
                Contact
              </a>
            </li>
            <li>
              <a href={BOOK} className="font-condensed uppercase tracking-widest text-sm text-gold">
                Book Now →
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
