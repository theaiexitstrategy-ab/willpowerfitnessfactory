'use client';

import { useState } from 'react';
import type { WizardState } from './OnboardingWizard';
import { PRODUCT_TEMPLATES } from '@/lib/product-templates';

export default function StepLaunch({
  state,
  submitting,
  error,
  onBack,
  onPublish,
}: {
  state: WizardState;
  submitting: boolean;
  error: string;
  onBack: () => void;
  onPublish: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${baseUrl}/shop/${state.storeSlug}`;
  const enabledCount = Object.values(state.selectedProducts).filter((p) => p.enabled).length;
  const igText = encodeURIComponent(
    `Just dropped: ${state.businessName} merch.\n\nShop now: ${url}`,
  );

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="panel text-center">
      <span className="eyebrow">Step 4</span>
      <h2 className="font-display text-[clamp(2rem,5vw,3rem)] mt-1 mb-4">READY TO LAUNCH</h2>
      <p className="text-light max-w-[52ch] mx-auto font-body leading-relaxed mb-8">
        Click publish and your store goes live. Customers can buy, Printify fulfills, and you get
        notified for every order.
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-[420px] mx-auto mb-8">
        <Stat label="Products" value={String(enabledCount)} />
        <Stat label="Logo" value={state.logoUrl ? '✓' : '—'} />
        <Stat label="Slug" value={state.storeSlug || '—'} />
      </div>

      {error && (
        <p className="text-red-400 font-condensed text-sm tracking-widest uppercase mb-4">{error}</p>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onPublish}
          disabled={submitting || !state.storeSlug}
          className="btn-gold disabled:opacity-50 text-base px-10 py-4"
        >
          {submitting ? 'Publishing…' : 'Publish Store →'}
        </button>

        <p className="text-silver text-xs uppercase tracking-widest font-condensed mt-4 mb-1">
          Your store URL
        </p>
        <p className="font-mono text-sm text-light break-all max-w-full">{url}</p>

        <div className="flex flex-wrap gap-2 justify-center mt-3">
          <button onClick={copy} className="btn-outline text-xs">
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
          <a
            href={`https://www.instagram.com/?caption=${igText}`}
            target="_blank"
            rel="noopener"
            className="btn-outline text-xs"
          >
            Share on Instagram
          </a>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-border flex justify-start">
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-silver hover:text-white font-condensed uppercase tracking-widest text-xs"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-3 bg-card">
      <p className="font-condensed font-bold text-2xl text-white truncate">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-silver mt-1">{label}</p>
    </div>
  );
}
