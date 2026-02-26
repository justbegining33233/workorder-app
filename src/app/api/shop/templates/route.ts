import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTemplatesByShop, createTemplate } from '@/lib/workorder-templates';

// GET /api/shop/templates — List all templates for the shop
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.shopId ?? auth.id;
  const templates = getTemplatesByShop(shopId);

  return NextResponse.json({ templates });
}

// POST /api/shop/templates — Create a new template
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.shopId ?? auth.id;
  const body = await request.json();

  const { name, serviceType, description, repairs, maintenance, estimatedCost, laborHours, notes } = body;

  if (!name || !serviceType) {
    return NextResponse.json({ error: 'name and serviceType are required' }, { status: 400 });
  }

  const template = createTemplate(shopId, {
    name,
    serviceType,
    description: description ?? '',
    repairs: repairs ?? [],
    maintenance: maintenance ?? [],
    estimatedCost: estimatedCost ?? 0,
    laborHours: laborHours ?? 0,
    notes: notes ?? '',
  });

  return NextResponse.json({ template }, { status: 201 });
}
