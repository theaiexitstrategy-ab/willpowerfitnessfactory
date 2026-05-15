import { cookies } from 'next/headers';

const COOKIE = 'wpff_admin';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function isAdminAuthed(): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookie = cookies().get(COOKIE)?.value;
  if (!cookie) return false;
  return timingSafeEqual(cookie, password);
}

export function setAdminCookie(value: string) {
  cookies().set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE);
}

export function verifyAdminPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return timingSafeEqual(input, password);
}
