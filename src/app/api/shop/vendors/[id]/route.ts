import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getVendorById, updateVendor, deleteVendor } from '@/lib/vendors';

// GET /api/shop/vendors/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const vendor = getVendorById(id);
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  return NextResponse.json({ vendor });
}

// PUT /api/shop/vendors/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = getVendorById(id);
  if (!existing) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const vendor = updateVendor(id, body);

  return NextResponse.json({ vendor });
}

// DELETE /api/shop/vendors/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = getVendorById(id);
  if (!existing) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  deleteVendor(id);
  return NextResponse.json({ success: true });
}
