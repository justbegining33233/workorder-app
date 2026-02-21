import { NextResponse } from 'next/server';
import { resetRateLimit, getRateLimitStatus } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = body?.identifier || body?.ip || body?.username;
    if (!identifier) {
      return NextResponse.json({ error: 'identifier required (ip or username)' }, { status: 400 });
    }

    resetRateLimit(identifier);
    const status = getRateLimitStatus(identifier);
    return NextResponse.json({ success: true, identifier, status });
  } catch (err) {
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
