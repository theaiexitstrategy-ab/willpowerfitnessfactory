'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, ProductTemplateKey } from '@/lib/types';
import { PRODUCT_TEMPLATES } from '@/lib/product-templates';
import StepBrand from './StepBrand';
import StepProducts from './StepProducts';
import StepPreview from './StepPreview';
import StepLaunch from './StepLaunch';

export type WizardState = {
  businessName: string;
  tagline: string;
  logoUrl: string | null;
  brandColor: string;
  selectedProducts: Record<ProductTemplateKey, { enabled: boolean; priceCents: number }>;
  storeSlug: string;
};

export default function OnboardingWizard({ initialClient }: { initialClient: Client }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [state, setState] = useState<WizardState>({
    businessName: initialClient.business_name,
    tagline: initialClient.tagline || '',
    logoUrl: initialClient.logo_url,
    brandColor: initialClient.brand_color || '#C9A84C',
    selectedProducts: PRODUCT_TEMPLATES.reduce(
      (acc, t) => ({
        ...acc,
        [t.key]: { enabled: ['tee', 'hoodie', 'snapback'].includes(t.key), priceCents: t.defaultPriceCents },
      }),
      {} as WizardState['selectedProducts'],
    ),
    storeSlug: initialClient.store_slug || '',
  });

  function update(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  async function publish() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/portal/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not publish store.');
      router.replace('/portal/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[1080px] mx-auto px-5 py-8 md:py-12">
      <StepBar step={step} />

      <div className="mt-8">
        {step === 1 && (
          <StepBrand
            state={state}
            update={update}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepProducts
            state={state}
            update={update}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            plan={initialClient.plan_tier}
          />
        )}
        {step === 3 && (
          <StepPreview
            state={state}
            update={update}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepLaunch
            state={state}
            submitting={submitting}
            error={error}
            onBack={() => setStep(3)}
            onPublish={publish}
          />
        )}
      </div>
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  const steps = ['Brand', 'Products', 'Preview', 'Launch'];
  return (
    <ol className="flex items-center gap-3 md:gap-5">
      {steps.map((label, idx) => {
        const n = idx + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex items-center gap-3 flex-1">
            <span
              className={`w-8 h-8 inline-flex items-center justify-center border ${
                active ? 'border-gold text-gold' : done ? 'border-white text-white' : 'border-border text-silver'
              } font-condensed font-bold`}
            >
              {done ? '✓' : n}
            </span>
            <span
              className={`font-condensed uppercase tracking-widest text-xs ${
                active ? 'text-white' : 'text-silver'
              } hidden md:inline`}
            >
              {label}
            </span>
            {n < steps.length && <span className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
