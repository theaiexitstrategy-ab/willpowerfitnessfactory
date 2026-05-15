import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/admin-auth';

export async function POST() {
  clearAdminCookie();
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    status: 303,
  });
}
