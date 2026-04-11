import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

/** Enforce that only the shop that owns the service (or admin/manager) may mutate it. */
async function assertServiceOwnership(user: AuthUser, serviceId: string): Promise<{ id: string; shopId: string } | NextResponse> {
  const service = await prisma.shopService.findUnique({ where: { id: serviceId }, select: { id: true, shopId: true } });
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  if (user.role === 'shop' && user.shopId !== service.shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return service;
}

// POST - Add a new service
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    const { shopId, serviceName, category, price } = body;

    if (!shopId || !serviceName || !category) {
      return NextResponse.json({ error: 'Shop ID, service name, and category are required' }, { status: 400 });
    }

    // Shop-role users may only add services to their own shop
    if (user.role === 'shop' && user.shopId !== shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create/update service
    let parsedPrice: number | undefined;
    if (price !== undefined && price !== null && price !== '') {
      const num = parseFloat(price);
      if (isNaN(num) || num < 0) {
        return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
      }
      parsedPrice = num;
    }

    // Check if service already exists for this shop with same category
    const existingService = await prisma.shopService.findUnique({
      where: { shopId_serviceName_category: { shopId, serviceName, category } },
    });

    // If it exists, allow setting/updating the price instead of failing
    if (existingService) {
      const updated = await prisma.shopService.update({
        where: { id: existingService.id },
        data: { price: parsedPrice },
      });
      return NextResponse.json({ message: 'Service updated successfully', service: updated }, { status: 200 });
    }

    const newService = await prisma.shopService.create({
      data: { shopId, serviceName, category, price: parsedPrice },
    });
    return NextResponse.json({ message: 'Service added successfully', service: newService }, { status: 201 });
  } catch (error) {
    console.error('Error adding service:', error);
    return NextResponse.json({ error: 'Failed to add service' }, { status: 500 });
  }
}

// DELETE - Remove a service
export async function DELETE(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const ownershipCheck = await assertServiceOwnership(user, serviceId);
    if (ownershipCheck instanceof NextResponse) return ownershipCheck;

    await prisma.shopService.delete({ where: { id: serviceId } });
    return NextResponse.json({ message: 'Service removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error removing service:', error);
    return NextResponse.json({ error: 'Failed to remove service' }, { status: 500 });
  }
}

// PUT - Update service details (labor time, price, description)
export async function PUT(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    const { serviceId, price, duration, description } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const ownershipCheck = await assertServiceOwnership(user, serviceId);
    if (ownershipCheck instanceof NextResponse) return ownershipCheck;

    let parsedPrice: number | undefined;
    if (price !== null && price !== undefined && price !== '') {
      const num = parseFloat(price);
      if (isNaN(num) || num < 0) {
        return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
      }
      parsedPrice = num;
    }

    let parsedDuration: number | null;
    if (duration !== null && duration !== undefined && duration !== '') {
      const num = parseInt(duration);
      if (isNaN(num) || num < 0) {
        return NextResponse.json({ error: 'Invalid duration value' }, { status: 400 });
      }
      parsedDuration = num;
    } else {
      parsedDuration = null;
    }

    const updatedService = await prisma.shopService.update({
      where: { id: serviceId },
      data: { price: parsedPrice, duration: parsedDuration, description: description || null },
    });

    return NextResponse.json({ message: 'Service updated successfully', service: updatedService }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}
