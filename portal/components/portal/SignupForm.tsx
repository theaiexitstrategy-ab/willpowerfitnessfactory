'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanTier } from '@/lib/types';

export default function SignupForm({ planTier }: { planTier: PlanTier }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, businessName, email, password, planTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-up failed');

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.replace('/portal/onboarding');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label>
        <span className="field-label">Your name</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        <span className="field-label">Business name</span>
        <input
          className="field"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          placeholder="e.g. Concrete Iron Gym"
        />
      </label>
      <label>
        <span className="field-label">Email</span>
        <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input
          type="password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <span className="text-[11px] text-silver mt-1 block">At least 8 characters.</span>
      </label>

      {error && <p className="text-red-400 font-condensed text-sm tracking-widest uppercase">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-gold w-full disabled:opacity-50">
        {submitting ? 'Creating…' : planTier === 'free' ? 'Create Account →' : 'Continue to Payment →'}
      </button>
    </form>
  );
}
