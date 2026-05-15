'use client';

import type { WizardState } from './OnboardingWizard';
import type { PlanTier, ProductTemplateKey } from '@/lib/types';
import { PRODUCT_TEMPLATES } from '@/lib/product-templates';
import { PLANS, platformFeeCents } from '@/lib/plans';

export default function StepProducts({
  state,
  update,
  onBack,
  onNext,
  plan,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onBack: () => void;
  onNext: () => void;
  plan: PlanTier;
}) {
  const tier = PLANS[plan];
  const enabledCount = Object.values(state.selectedProducts).filter((p) => p.enabled).length;
  const overLimit = enabledCount > tier.productLimit;

  function toggle(key: ProductTemplateKey) {
    update({
      selectedProducts: {
        ...state.selectedProducts,
        [key]: { ...state.selectedProducts[key], enabled: !state.selectedProducts[key].enabled },
      },
    });
  }

  function setPrice(key: ProductTemplateKey, priceCents: number) {
    update({
      selectedProducts: {
        ...state.selectedProducts,
        [key]: { ...state.selectedProducts[key], priceCents },
      },
    });
  }

  return (
    <div className="panel">
      <span className="eyebrow">Step 2</span>
      <h2 className="font-display text-3xl mt-1 mb-2">CHOOSE PRODUCTS</h2>
      <p className="text-silver text-sm font-body leading-relaxed mb-6">
        Turn on the products you want to sell. Set your retail price — we'll show your margin live
        after the {tier.platformFeeBps / 100}% platform fee and the base print cost.
        {Number.isFinite(tier.productLimit) && (
          <span className="text-light"> Your <strong>{tier.name}</strong> plan allows {tier.productLimit} active products.</span>
        )}
      </p>

      {overLimit && (
        <p className="border border-gold/40 bg-gold/10 text-gold text-xs font-condensed uppercase tracking-widest p-3 mb-4">
          You have {enabledCount} products enabled but your plan allows {tier.productLimit}. Turn some off, or
          upgrade in Billing after onboarding.
        </p>
      )}

      <ul className="space-y-3">
        {PRODUCT_TEMPLATES.map((t) => {
          const item = state.selectedProducts[t.key];
          const fee = platformFeeCents(item.priceCents, plan);
          const margin = item.priceCents - t.baseCostCents - fee;
          return (
            <li
              key={t.key}
              className={`border ${
                item.enabled ? 'border-gold/50 bg-card' : 'border-border bg-char'
              } p-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => toggle(t.key)}
                    className="w-5 h-5 accent-gold"
                  />
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wide text-base">
                      {t.name}
                    </p>
                    <p className="text-xs text-silver">Base cost ${(t.baseCostCents / 100).toFixed(2)} · {t.category}</p>
                  </div>
                </label>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-[11px] text-silver uppercase tracking-widest">Retail</span>
                    <input
                      type="number"
                      min={Math.ceil((t.baseCostCents + 200) / 100)}
                      step={1}
                      value={(item.priceCents / 100).toFixed(0)}
                      onChange={(e) => setPrice(t.key, Math.max(0, Number(e.target.value)) * 100)}
                      className="field w-24 text-center"
                      disabled={!item.enabled}
                    />
                  </label>
                  <div className={`text-right min-w-[100px] ${margin < 500 ? 'text-red-400' : 'text-gold'}`}>
                    <p className="text-[10px] uppercase tracking-widest text-silver">You make</p>
                    <p className="font-condensed font-bold text-lg">${(margin / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
        <button onClick={onBack} className="text-silver hover:text-white font-condensed uppercase tracking-widest text-xs">
          ← Back
        </button>
        <button onClick={onNext} disabled={enabledCount === 0 || overLimit} className="btn-gold disabled:opacity-50">
          Continue →
        </button>
      </div>
    </div>
  );
}
