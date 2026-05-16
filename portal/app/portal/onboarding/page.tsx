import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import OnboardingWizard from '@/components/portal/OnboardingWizard';
import Logo from '@/components/Logo';
import { BRAND } from '@/lib/brand';
import type { Client } from '@/lib/types';

export const metadata = { title: `Set up your store | ${BRAND.name}` };
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!client) redirect('/portal/signup');

  return (
    <div className="min-h-screen">
      <header className="border-b border-border py-4 px-5 flex items-center justify-between">
        <Logo height={28} />
        <p className="font-condensed uppercase tracking-widest text-xs text-silver">Store setup</p>
      </header>
      <OnboardingWizard initialClient={client as Client} />
    </div>
  );
}
