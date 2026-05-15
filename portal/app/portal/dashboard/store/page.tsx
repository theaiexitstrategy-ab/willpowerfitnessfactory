import { supabaseServer } from '@/lib/supabase/server';
import type { Client, Product } from '@/lib/types';
import StoreEditor from '@/components/portal/StoreEditor';

export const dynamic = 'force-dynamic';

export default async function MyStorePage() {
  const supabase = supabaseServer();
  const { data: client } = await supabase.from('clients').select('*').single();
  const c = client as Client | null;
  if (!c) return null;

  const { data: products } = await supabase.from('products').select('*').eq('client_id', c.id);

  return (
    <div className="px-5 py-8 md:py-12 max-w-[1080px]">
      <span className="eyebrow">Storefront</span>
      <h1 className="font-display text-[clamp(2rem,5vw,2.8rem)] mt-2 mb-6">MY STORE</h1>
      <StoreEditor client={c} products={(products || []) as Product[]} />
    </div>
  );
}
