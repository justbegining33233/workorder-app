import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getLocationById, updateLocation, deleteLocation } from '@/lib/shop-locations';

// GET /api/shop/locations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const location = getLocationById(id);
  if (!location) return NextResponse.json({ error: 'Location not found' }, { status: 404 });

  return NextResponse.json({ location });
}

// PUT /api/shop/locations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = getLocationById(id);
  if (!existing) return NextResponse.json({ error: 'Location not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const location = updateLocation(id, body);

  return NextResponse.json({ location });
}

// DELETE /api/shop/locations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = getLocationById(id);
  if (!existing) return NextResponse.json({ error: 'Location not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  deleteLocation(id);
  return NextResponse.json({ success: true });
}
