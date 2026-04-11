import { NextRequest, NextResponse } from 'next/server';
import { getAllTenants, getTenantById, createTenant, updateTenant } from '@/lib/tenants';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const tenant = await getTenantById(id);
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      return NextResponse.json(tenant);
    }

    const tenants = await getAllTenants();
    return NextResponse.json(tenants);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    if (!body.companyName || !body.subdomain || !body.contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, subdomain, contactEmail' },
        { status: 400 }
      );
    }

    const tenant = await createTenant(body);
    return NextResponse.json(tenant, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const updatedTenant = await updateTenant(id, body);

    if (!updatedTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTenant);
  } catch {
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}
