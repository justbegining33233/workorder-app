import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  // Expose readable cookie so client can double-submit
  res.cookies.set('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  });
  return res;
}
