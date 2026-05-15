'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Product, ProductTemplateKey } from '@/lib/types';
import { PRODUCT_TEMPLATES, getTemplate } from '@/lib/product-templates';
import { platformFeeCents, PLANS } from '@/lib/plans';

export default function ProductsEditor({ client, products }: { client: Client; products: Product[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const productByKey = new Map<ProductTemplateKey, Product>(
    products.map((p) => [p.template_key as ProductTemplateKey, p]),
  );

  const planTier = client.plan_tier;
  const planLimit = PLANS[planTier].productLimit;
  const activeCount = products.filter((p) => p.active).length;

  async function patch(template_key: ProductTemplateKey, body: Record<string, unknown>) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/portal/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_key, ...body }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-silver text-sm font-body mb-4 leading-relaxed">
        Toggle products on/off, set retail prices. Active count:{' '}
        <strong className="text-white">{activeCount}</strong>
        {Number.isFinite(planLimit) && (
          <span> / {planLimit} (plan limit)</span>
        )}.
      </p>

      {error && <p className="text-red-400 font-condensed text-sm tracking-widest uppercase mb-4">{error}</p>}

      <ul className="space-y-3">
        {PRODUCT_TEMPLATES.map((t) => {
          const p = productByKey.get(t.key);
          const priceCents = p?.price_cents ?? t.defaultPriceCents;
          const fee = platformFeeCents(priceCents, planTier);
          const margin = priceCents - t.baseCostCents - fee;
          const active = p?.active ?? false;
          const exists = !!p;

          return (
            <li
              key={t.key}
              className={`border ${active ? 'border-gold/50 bg-card' : 'border-border bg-char'} p-4 flex flex-col sm:flex-row sm:items-center gap-4`}
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    patch(t.key, { active: !active, ...(exists ? {} : { create: true, priceCents }) })
                  }
                  className="w-5 h-5 accent-gold"
                  disabled={saving}
                />
                <div>
                  <p className="font-condensed font-bold uppercase tracking-wide text-base">{t.name}</p>
                  <p className="text-xs text-silver">Base cost ${(t.baseCostCents / 100).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <span className="text-[11px] text-silver uppercase tracking-widest">Retail</span>
                  <input
                    type="number"
                    min={Math.ceil((t.baseCostCents + 200) / 100)}
                    step={1}
                    defaultValue={(priceCents / 100).toFixed(0)}
                    onBlur={(e) => {
                      const cents = Math.max(0, Number(e.target.value)) * 100;
                      if (cents !== priceCents) patch(t.key, { priceCents: cents });
                    }}
                    className="field w-24 text-center"
                    disabled={saving || !active}
                  />
                </label>
                <div className={`text-right min-w-[100px] ${margin < 500 ? 'text-red-400' : 'text-gold'}`}>
                  <p className="text-[10px] uppercase tracking-widest text-silver">You make</p>
                  <p className="font-condensed font-bold text-lg">${(margin / 100).toFixed(2)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
