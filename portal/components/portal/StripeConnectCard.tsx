'use client';

import { useState } from 'react';

export default function StripeConnectCard({
  accountId,
  status,
}: {
  accountId: string | null;
  status: 'not_connected' | 'pending' | 'active';
}) {
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    try {
      const res = await fetch('/api/portal/stripe/connect', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Could not start Stripe Connect onboarding.');
        setBusy(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Connect failed');
      setBusy(false);
    }
  }

  const label =
    status === 'active' ? 'Connected ✓' : status === 'pending' ? 'Continue setup →' : 'Link your Stripe account →';
  const sub =
    status === 'active'
      ? 'Payouts route directly to your bank from Stripe.'
      : status === 'pending'
        ? 'You started Stripe onboarding but haven\'t finished. Click below to finish.'
        : 'Connect your own Stripe account so customer payments deposit straight into your bank, minus the platform fee. We never hold your money.';

  return (
    <div className="panel">
      <span className="eyebrow">Payouts</span>
      <h2 className="font-display text-xl mt-1 mb-3">STRIPE ACCOUNT</h2>
      <p className="text-silver text-sm font-body leading-relaxed mb-4">{sub}</p>

      {accountId && status === 'active' && (
        <p className="font-mono text-[11px] text-silver mb-3 break-all">Account: {accountId}</p>
      )}

      <button
        onClick={connect}
        disabled={busy || status === 'active'}
        className={status === 'active' ? 'btn-outline disabled:opacity-50' : 'btn-gold disabled:opacity-50'}
      >
        {busy ? 'Redirecting…' : label}
      </button>
    </div>
  );
}
