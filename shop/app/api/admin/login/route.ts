import { NextResponse } from 'next/server';
import { setAdminCookie, verifyAdminPassword } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password: string };
    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    setAdminCookie(password);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
