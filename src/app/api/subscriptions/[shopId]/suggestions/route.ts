import { NextRequest, NextResponse } from 'next/server';
import { getUpgradeSuggestions } from '@/lib/subscription.server';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { shopId } = await params;
    const suggestions = await getUpgradeSuggestions(shopId);
    return NextResponse.json(suggestions);
  } catch (e: unknown) {
    console.error('Failed to get suggestions:', (e as Error)?.message || e);
    return NextResponse.json([], { status: 500 });
  }
}
