import { NextRequest, NextResponse } from 'next/server';
import { getAllTenants, getTenantById, createTenant, updateTenant } from '@/lib/tenants';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const tenant = getTenantById(id);
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      return NextResponse.json(tenant);
    }

    const tenants = getAllTenants();
    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const body = await request.json();
    
    // Validate required fields
    if (!body.companyName || !body.subdomain || !body.contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, subdomain, contactEmail' },
        { status: 400 }
      );
    }

    const tenant = createTenant(body);
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const updatedTenant = updateTenant(id, body);

    if (!updatedTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTenant);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}
