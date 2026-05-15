'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError('Incorrect password');
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="eyebrow block mb-1.5">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="w-full bg-[#0a0a0a] border border-border text-white font-body px-4 py-3 outline-none focus:border-gold transition-colors"
        />
      </label>
      {error && (
        <p className="text-red-400 font-condensed text-sm tracking-widest uppercase">{error}</p>
      )}
      <button type="submit" disabled={submitting} className="btn-gold w-full disabled:opacity-50">
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
