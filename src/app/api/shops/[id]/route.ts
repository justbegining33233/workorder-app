import { NextRequest, NextResponse } from 'next/server';
import { getShopById } from '../../../../lib/shops';

// GET /api/shops/[id] - Returns shop profile by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Defensive: log incoming request details for debugging

  // Robust id extraction: prefer params, fallback to URL parsing
  let id: string | undefined = (await params).id;
  if (!id) {
    try {
      const parsed = new URL(req.url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      id = parts.length ? parts[parts.length - 1] : undefined;
    } catch (e) {
    }
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing shop id', debug: { url: req.url, params } }, { status: 400 });
  }

  try {
    const shop = await getShopById(id);
    if (!shop) {
      // Try to provide helpful diagnostics
      try {
        const prisma = (await import('@/lib/prisma')).default;
        const alt = await prisma.shop.findFirst({ where: { id } });
      } catch (err) {
      }

      return NextResponse.json({ error: 'Shop not found', debug: { id } }, { status: 404 });
    }
    return NextResponse.json({ shop });
  } catch (error) {
    console.error('[SHOPS API] Failed to fetch shop profile', error);
    return NextResponse.json({ error: 'Failed to fetch shop profile', details: String(error) }, { status: 500 });
  }
}
