'use client';

import { useState } from 'react';

export default function BillingActions({ stripeSubscriptionId }: { stripeSubscriptionId: string }) {
  const [busy, setBusy] = useState(false);

  async function portal() {
    setBusy(true);
    try {
      const res = await fetch('/api/portal/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        alert(data.error || 'Could not open billing portal.');
        setBusy(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 pt-4 border-t border-border">
      <button onClick={portal} disabled={busy} className="btn-outline disabled:opacity-50">
        {busy ? 'Opening…' : 'Manage subscription / invoices →'}
      </button>
      <p className="text-[11px] text-silver mt-2">
        Stripe customer portal. View invoices, update card, cancel.
      </p>
    </div>
  );
}
