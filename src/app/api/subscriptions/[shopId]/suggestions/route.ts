import { NextRequest, NextResponse } from 'next/server';
import { getUpgradeSuggestions } from '@/lib/subscription.server';

export async function GET(request: NextRequest, context: any) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const shopId = params?.shopId;
    const suggestions = await getUpgradeSuggestions(shopId);
    return NextResponse.json(suggestions);
  } catch (e:any) {
    console.error('Failed to get suggestions:', (e as any)?.message || e);
    return NextResponse.json([], { status: 500 });
  }
}
