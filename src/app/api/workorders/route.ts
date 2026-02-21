import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';
import { sendWorkOrderCreatedEmail } from '@/lib/email';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { workOrderCreateSchema } from '@/lib/validation';
import { sanitizeObject } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page') || '1';
    const limitParam = searchParams.get('limit') || '20';
    const page = parseInt(pageParam);
    const limit = parseInt(limitParam);
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: 'Invalid page parameter' }, { status: 400 });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid limit parameter (1-100)' }, { status: 400 });
    }
    const status = searchParams.get('status');
    const shopId = searchParams.get('shopId');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'status', 'priority', 'dueDate'] as const;
    const sortByRaw = searchParams.get('sortBy') || 'createdAt';
    const sortBy: string = (ALLOWED_SORT_FIELDS as readonly string[]).includes(sortByRaw) ? sortByRaw : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    
    // Build where clause
    const where: any = {};
    
    // Role-based filtering
    if (auth.role === 'customer') {
      where.customerId = auth.id;
    } else if (auth.role === 'tech' || auth.role === 'manager') {
      where.shopId = auth.shopId;
    } else if (auth.role === 'shop') {
      where.shopId = auth.id;
    }
    
    // Additional filters
    if (status) where.status = status;
    if (shopId && (auth.role === 'admin' || auth.role === 'customer')) {
      where.shopId = shopId;
    }
    if (customerId && (auth.role === 'admin' || auth.role === 'shop' || auth.role === 'manager')) {
      where.customerId = customerId;
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { issueDescription: { contains: search, mode: 'insensitive' } },
        { vehicleType: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get total count
    const total = await prisma.workOrder.count({ where });
    
    // Get paginated results
    const rawWorkOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // Parse JSON fields
    const workOrders = rawWorkOrders.map(wo => ({
      ...wo,
      services: wo.repairs || wo.maintenance ? {
        repairs: wo.repairs ? JSON.parse(wo.repairs) : undefined,
        maintenance: wo.maintenance ? JSON.parse(wo.maintenance) : undefined,
      } : undefined,
      partsMaterials: wo.partsMaterials ? JSON.parse(wo.partsMaterials) : undefined,
      issueDescription: {
        symptoms: wo.issueDescription,
        pictures: wo.pictures ? JSON.parse(wo.pictures) : [],
      },
      location: wo.location ? JSON.parse(wo.location) : undefined,
      estimate: wo.estimate ? JSON.parse(wo.estimate) : undefined,
      techLabor: wo.techLabor ? JSON.parse(wo.techLabor) : undefined,
      partsUsed: wo.partsUsed ? JSON.parse(wo.partsUsed) : undefined,
      workPhotos: wo.workPhotos ? JSON.parse(wo.workPhotos) : [],
      completion: wo.completion ? JSON.parse(wo.completion) : undefined,
    }));
    
    return NextResponse.json({
      workOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  
  if (auth.role !== 'customer') {
    return NextResponse.json({ error: 'Only customers can create work orders' }, { status: 403 });
  }
  // If request uses cookie-based auth (no Authorization header), require CSRF
  if (!request.headers.get('authorization')) {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }
  
  const rateLimitResult = rateLimit(rateLimitConfigs.api)(request);
  if (rateLimitResult) return rateLimitResult;
  
  try {
    const data = await request.json();
    const sanitizedData = sanitizeObject(data);
    
    const workOrder = await prisma.workOrder.create({
      data: {
        customerId: auth.id,
        shopId: sanitizedData.shopId,
        vehicleType: sanitizedData.vehicleType,
        serviceLocation: sanitizedData.serviceLocationType || 'in-shop',
        repairs: sanitizedData.services?.repairs || [],
        maintenance: sanitizedData.services?.maintenance || [],
        partsMaterials: sanitizedData.partsMaterials,
        issueDescription: sanitizedData.issueDescription,
        pictures: sanitizedData.issueDescription?.pictures || [],
        vinPhoto: sanitizedData.vinPhoto,
        location: sanitizedData.vehicleLocation,
        status: 'pending',
      },
      include: {
        customer: true,
        shop: true,
      },
    });
    
    // Send email notification
    sendWorkOrderCreatedEmail(workOrder.customer.email, workOrder.id).catch(console.error);
    
    // Create notification
    await prisma.notification.create({
      data: {
        customerId: auth.id,
        type: 'workorder',
        title: 'Work Order Created',
        message: `Your work order ${workOrder.id} has been created successfully`,
        workOrderId: workOrder.id,
        deliveryMethod: 'in-app',
      },
    });
    
    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
