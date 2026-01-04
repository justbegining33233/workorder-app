import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  
  if (auth.role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        createdAt: true,
      },
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  
  if (auth.role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    
    const customer = await prisma.customer.update({
      where: { id: auth.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        company: body.company,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
      },
    });
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
