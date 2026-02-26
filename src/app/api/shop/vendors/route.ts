import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getVendorsByShop, createVendor } from '@/lib/vendors';

// GET /api/shop/vendors — List all vendors for the shop
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.shopId ?? auth.id;
  const vendors = getVendorsByShop(shopId);

  return NextResponse.json({ vendors });
}

// POST /api/shop/vendors — Create a new vendor
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.shopId ?? auth.id;
  const body = await request.json();

  const { name, contactName, phone, email, website, category, accountNumber, paymentTerms, rating, notes, isActive } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const vendor = createVendor(shopId, {
    name,
    contactName: contactName ?? '',
    phone: phone ?? '',
    email: email ?? '',
    website: website ?? '',
    category: category ?? 'parts',
    accountNumber: accountNumber ?? '',
    paymentTerms: paymentTerms ?? 'Net 30',
    rating: rating ?? 5,
    notes: notes ?? '',
    isActive: isActive ?? true,
  });

  return NextResponse.json({ vendor }, { status: 201 });
}
