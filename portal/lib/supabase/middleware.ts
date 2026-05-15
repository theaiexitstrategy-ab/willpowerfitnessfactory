import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          request.cookies.set({ name, value, ...options });
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          request.cookies.set({ name, value: '', ...options });
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthedRoute = pathname.startsWith('/portal/dashboard') || pathname.startsWith('/portal/onboarding');
  const isAuthPage = pathname === '/portal/login' || pathname === '/portal/signup';

  if (isAuthedRoute && !user) {
    return NextResponse.redirect(new URL('/portal/login', request.url));
  }
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/portal/dashboard', request.url));
  }

  return supabaseResponse;
}
