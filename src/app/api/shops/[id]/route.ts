import { NextRequest, NextResponse } from 'next/server';
import { getShopById } from '../../../../lib/shops';

// GET /api/shops/[id] - Returns shop profile by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  if (!id) {
    return NextResponse.json({ error: 'Missing shop id' }, { status: 400 });
  }

  try {
    const shop = await getShopById(id);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    return NextResponse.json({ shop });
  } catch (error) {
    console.error('[SHOPS API] Failed to fetch shop profile', error);
    return NextResponse.json({ error: 'Failed to fetch shop profile' }, { status: 500 });
  }
}
