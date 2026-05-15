'use client';

import { useState } from 'react';
import type { WizardState } from './OnboardingWizard';
import LogoUploader from './LogoUploader';
import TeeMockup from './TeeMockup';

export default function StepBrand({
  state,
  update,
  onNext,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
      <div className="panel space-y-5">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2 className="font-display text-3xl mt-1">BRAND SETUP</h2>
          <p className="text-silver text-sm mt-2 font-body leading-relaxed">
            Drop in your logo, tagline, and color. This is how your storefront and merch will look.
          </p>
        </div>

        <LogoUploader
          currentUrl={state.logoUrl}
          uploading={uploading}
          setUploading={setUploading}
          onUploaded={(url) => update({ logoUrl: url })}
        />

        <label>
          <span className="field-label">Business name</span>
          <input
            className="field"
            value={state.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            required
          />
        </label>

        <label>
          <span className="field-label">Tagline</span>
          <input
            className="field"
            placeholder="e.g. Built like training, designed for the street."
            value={state.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            maxLength={80}
          />
        </label>

        <label>
          <span className="field-label">Brand accent color</span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={state.brandColor}
              onChange={(e) => update({ brandColor: e.target.value })}
              className="w-12 h-12 rounded-none bg-transparent border border-border cursor-pointer"
            />
            <input
              type="text"
              value={state.brandColor}
              onChange={(e) => update({ brandColor: e.target.value })}
              className="field flex-1"
              pattern="^#[0-9a-fA-F]{6}$"
            />
          </div>
        </label>

        <div className="flex justify-end pt-2">
          <button onClick={onNext} disabled={uploading} className="btn-gold disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Continue →'}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6">
        <span className="eyebrow block mb-2">Preview</span>
        <TeeMockup logoUrl={state.logoUrl} accent={state.brandColor} />
        <p className="text-[11px] text-silver mt-3">
          Your logo will be centered and scaled to fit each product's print area.
        </p>
      </aside>
    </div>
  );
}
