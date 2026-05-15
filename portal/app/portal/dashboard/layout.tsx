import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import SidebarNav from '@/components/portal/SidebarNav';
import Logo from '@/components/Logo';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: client } = await supabase
    .from('clients')
    .select('business_name, plan_tier, store_status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (client && client.store_status === 'draft') {
    redirect('/portal/onboarding');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-[240px] md:min-h-screen md:border-r border-border bg-[#070707] flex-shrink-0">
        <div className="p-5 border-b border-border">
          <Logo height={26} />
          {client && (
            <div className="mt-3">
              <p className="font-condensed font-bold uppercase tracking-wide text-sm text-white truncate">
                {client.business_name}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-gold">
                {client.plan_tier} plan
              </p>
            </div>
          )}
        </div>
        <SidebarNav />
      </aside>
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  );
}
