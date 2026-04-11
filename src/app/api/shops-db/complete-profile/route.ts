import { NextRequest, NextResponse } from 'next/server';

// DEPRECATED -- superseded by /api/shops/complete-profile (308 permanent redirect)
function redirect(request: NextRequest) {
  const dest = new URL('/api/shops/complete-profile' + new URL(request.url).search, request.url);
  return NextResponse.redirect(dest, { status: 308 });
}
export const GET = redirect;
export const POST = redirect;
export const PATCH = redirect;

