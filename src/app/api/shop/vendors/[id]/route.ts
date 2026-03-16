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
  const vendor = await getVendorById(id);
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
  const existing = await getVendorById(id);
  if (!existing) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const vendor = await updateVendor(id, body);

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
  const existing = await getVendorById(id);
  if (!existing) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await deleteVendor(id);
  return NextResponse.json({ success: true });
}
