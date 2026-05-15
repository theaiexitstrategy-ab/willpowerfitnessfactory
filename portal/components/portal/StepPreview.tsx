'use client';

import { useState } from 'react';
import type { WizardState } from './OnboardingWizard';
import { PRODUCT_TEMPLATES } from '@/lib/product-templates';
import { slugify } from '@/lib/slug';

export default function StepPreview({
  state,
  update,
  onBack,
  onNext,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [slugInput, setSlugInput] = useState(state.storeSlug);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const activeProducts = PRODUCT_TEMPLATES.filter(
    (t) => state.selectedProducts[t.key]?.enabled,
  );

  return (
    <div className="panel">
      <span className="eyebrow">Step 3</span>
      <h2 className="font-display text-3xl mt-1 mb-2">STORE PREVIEW</h2>
      <p className="text-silver text-sm font-body leading-relaxed mb-6">
        This is what your customers will see. Lock in your store URL — they'll be sharing this link.
      </p>

      <div className="mb-6">
        <span className="field-label">Your store URL</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-silver text-sm">{baseUrl}/shop/</span>
          <input
            value={slugInput}
            onChange={(e) => {
              const v = slugify(e.target.value);
              setSlugInput(v);
              update({ storeSlug: v });
            }}
            className="field max-w-[280px]"
            placeholder="your-brand"
            pattern="^[a-z0-9-]+$"
            required
          />
        </div>
        <p className="text-[11px] text-silver mt-1">Letters, numbers, and dashes only.</p>
      </div>

      <div
        className="border border-border overflow-hidden"
        style={{ background: '#0a0a0a' }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between border-b border-border"
          style={{ background: '#000' }}
        >
          {state.logoUrl ? (
            <img src={state.logoUrl} alt="" className="h-8 max-w-[160px] object-contain" />
          ) : (
            <span className="font-display text-2xl text-white">{state.businessName.toUpperCase()}</span>
          )}
          <span
            className="font-condensed font-bold uppercase tracking-widest text-xs px-3 py-1.5"
            style={{ background: state.brandColor, color: '#000' }}
          >
            Shop
          </span>
        </div>

        <div className="px-5 py-8 text-center" style={{ borderBottom: `1px solid ${state.brandColor}30` }}>
          <h3
            className="font-display text-4xl"
            style={{ color: state.brandColor }}
          >
            {state.businessName.toUpperCase()}
          </h3>
          {state.tagline && <p className="text-light text-sm mt-2 font-body">{state.tagline}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
          {activeProducts.map((t) => {
            const item = state.selectedProducts[t.key];
            return (
              <div key={t.key} className="bg-char p-4">
                <div
                  className="aspect-square flex items-center justify-center mb-3"
                  style={{ background: '#0f0f0f', border: `1px solid ${state.brandColor}40` }}
                >
                  {state.logoUrl ? (
                    <img src={state.logoUrl} alt="" className="max-w-[60%] max-h-[60%] object-contain" />
                  ) : (
                    <span className="text-silver text-xs uppercase tracking-widest">{t.name}</span>
                  )}
                </div>
                <p className="font-condensed font-bold uppercase tracking-wide text-sm text-white">
                  {t.name}
                </p>
                <p className="font-condensed font-bold text-sm mt-1" style={{ color: state.brandColor }}>
                  ${(item.priceCents / 100).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
        <button onClick={onBack} className="text-silver hover:text-white font-condensed uppercase tracking-widest text-xs">
          ← Back
        </button>
        <button onClick={onNext} disabled={!slugInput} className="btn-gold disabled:opacity-50">
          Continue →
        </button>
      </div>
    </div>
  );
}
