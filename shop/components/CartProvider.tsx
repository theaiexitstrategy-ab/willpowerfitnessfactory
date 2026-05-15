'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CartItem } from '@/lib/types';

type CartContextValue = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: CartItem) => void;
  remove: (productId: string, color: string, size: string) => void;
  setQty: (productId: string, color: string, size: string, qty: number) => void;
  clear: () => void;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'wpff-cart-v1';

function sameLine(a: CartItem, productId: string, color: string, size: string) {
  return a.productId === productId && a.color === color && a.size === size;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.findIndex((p) => sameLine(p, item.productId, item.color, item.size));
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], quantity: next[existing].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((productId: string, color: string, size: string) => {
    setItems((prev) => prev.filter((p) => !sameLine(p, productId, color, size)));
  }, []);

  const setQty = useCallback((productId: string, color: string, size: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (sameLine(p, productId, color, size) ? { ...p, quantity: qty } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotalCents = items.reduce((sum, i) => sum + Math.round(i.price * 100) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, open, setOpen, add, remove, setQty, clear, subtotalCents }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
