import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateCsrf } from '@/lib/csrf';

// POST - Add a new service
export async function POST(request: NextRequest) {
  try {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    const body = await request.json();
    const { shopId, serviceName, category, price } = body;

    if (!shopId || !serviceName || !category) {
      return NextResponse.json({ error: 'Shop ID, service name, and category are required' }, { status: 400 });
    }

    // Check if service already exists for this shop with same category
    const existingService = await prisma.shopService.findUnique({
      where: {
        shopId_serviceName_category: {
          shopId,
          serviceName,
          category,
        },
      },
    });

    if (existingService) {
      return NextResponse.json({ error: 'This service already exists' }, { status: 400 });
    }

    // Create new service
    let parsedPrice: number | undefined;
    if (price !== undefined && price !== null && price !== '') {
      const num = parseFloat(price);
      if (isNaN(num) || num < 0) {
        return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
      }
      parsedPrice = num;
    }

    const newService = await prisma.shopService.create({
      data: {
        shopId,
        serviceName,
        category,
        price: parsedPrice,
      },
    });

    return NextResponse.json({
      message: 'Service added successfully',
      service: newService,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding service:', error);
    return NextResponse.json({ error: 'Failed to add service' }, { status: 500 });
  }
}

// DELETE - Remove a service
export async function DELETE(request: NextRequest) {
  try {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Delete the service
    await prisma.shopService.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({
      message: 'Service removed successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Error removing service:', error);
    return NextResponse.json({ error: 'Failed to remove service' }, { status: 500 });
  }
}

// PUT - Update service details (labor time, price, description)
export async function PUT(request: NextRequest) {
  try {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    const body = await request.json();
    const { serviceId, price, duration, description } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Update the service
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
      data: {
        price: parsedPrice,
        duration: parsedDuration,
        description: description || null,
      },
    });

    return NextResponse.json({
      message: 'Service updated successfully',
      service: updatedService,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}
