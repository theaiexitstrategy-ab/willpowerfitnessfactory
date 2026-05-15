'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Product } from '@/lib/types';
import LogoUploader from './LogoUploader';

export default function StoreEditor({ client, products }: { client: Client; products: Product[] }) {
  const router = useRouter();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const storeUrl = `${baseUrl}/shop/${client.store_slug}`;

  const [businessName, setBusinessName] = useState(client.business_name);
  const [tagline, setTagline] = useState(client.tagline || '');
  const [logoUrl, setLogoUrl] = useState(client.logo_url);
  const [brandColor, setBrandColor] = useState(client.brand_color);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/portal/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, tagline, logoUrl, brandColor }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      setSavedAt(new Date());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="panel space-y-5">
        <div>
          <span className="field-label">Store URL</span>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="font-mono text-sm text-light break-all">{storeUrl}</code>
            <button onClick={copy} className="btn-outline text-xs py-2 px-3">
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <a href={storeUrl} target="_blank" rel="noopener" className="btn-outline text-xs py-2 px-3">
              Visit ↗
            </a>
          </div>
        </div>

        <LogoUploader
          currentUrl={logoUrl}
          uploading={uploading}
          setUploading={setUploading}
          onUploaded={(url) => setLogoUrl(url)}
        />

        <label>
          <span className="field-label">Business name</span>
          <input className="field" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </label>

        <label>
          <span className="field-label">Tagline</span>
          <input className="field" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={80} />
        </label>

        <label>
          <span className="field-label">Brand accent color</span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-12 h-12 bg-transparent border border-border cursor-pointer"
            />
            <input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="field flex-1"
            />
          </div>
        </label>

        {error && <p className="text-red-400 font-condensed text-sm tracking-widest uppercase">{error}</p>}

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <button onClick={save} disabled={saving || uploading} className="btn-gold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {savedAt && <span className="text-silver text-xs">Saved {savedAt.toLocaleTimeString()}</span>}
        </div>
      </div>

      <aside className="panel">
        <h3 className="font-display text-xl">PRODUCTS LIVE</h3>
        <p className="text-3xl font-condensed font-bold text-gold mt-1">
          {products.filter((p) => p.active).length}
          <span className="text-silver text-base"> / {products.length}</span>
        </p>
        <p className="text-silver text-xs mt-3 leading-relaxed">
          Manage individual products and prices in the{' '}
          <a href="/portal/dashboard/products" className="text-gold underline">Products tab</a>.
        </p>
      </aside>
    </div>
  );
}
