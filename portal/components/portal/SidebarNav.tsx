'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

const ITEMS = [
  { href: '/portal/dashboard', label: 'Dashboard' },
  { href: '/portal/dashboard/store', label: 'My Store' },
  { href: '/portal/dashboard/products', label: 'Products' },
  { href: '/portal/dashboard/orders', label: 'Orders' },
  { href: '/portal/dashboard/settings', label: 'Settings' },
  { href: '/portal/dashboard/billing', label: 'Billing' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace('/portal/login');
    router.refresh();
  }

  return (
    <nav className="p-2">
      <ul>
        {ITEMS.map((it) => {
          const active =
            it.href === '/portal/dashboard'
              ? pathname === it.href
              : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block px-3 py-2.5 font-condensed uppercase tracking-widest text-xs transition-colors ${
                  active ? 'text-gold bg-card' : 'text-silver hover:text-white'
                }`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border mt-4 pt-3 px-3">
        <button
          onClick={logout}
          className="text-silver hover:text-white font-condensed uppercase tracking-widest text-xs"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
