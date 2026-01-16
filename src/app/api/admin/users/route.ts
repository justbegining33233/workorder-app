import { NextRequest, NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/auditLog';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only super admins can access user management
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Fetch all customers
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Fetch all shops
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        shopName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Fetch all technicians
    const technicians = await prisma.tech.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            shopName: true
          }
        }
      }
    });

    // Format the response
    const users = [
      ...customers.map(customer => ({
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        role: 'customer',
        status: 'active',
        joinedDate: customer.createdAt.toISOString(),
        lastLogin: customer.updatedAt.toISOString(),
        organization: null
      })),
      ...shops.map(shop => ({
        id: shop.id,
        name: shop.shopName,
        email: shop.email,
        role: 'shop',
        status: shop.status === 'approved' ? 'active' : shop.status === 'pending' ? 'pending' : 'suspended',
        joinedDate: shop.createdAt.toISOString(),
        lastLogin: shop.updatedAt.toISOString(),
        organization: shop.shopName
      })),
      ...technicians.map(tech => ({
        id: tech.id,
        name: `${tech.firstName} ${tech.lastName}`,
        email: tech.email || '',
        role: tech.role === 'manager' ? 'manager' : 'technician',
        status: 'active',
        joinedDate: tech.createdAt.toISOString(),
        lastLogin: tech.updatedAt.toISOString(),
        organization: tech.shop?.shopName || null
      }))
    ];

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, role, status, userType } = await request.json();
    
    if (!id || !userType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let updated = null;

    // Update based on user type
    if (userType === 'shop') {
      updated = await prisma.shop.update({
        where: { id },
        data: {
          ...(status && { status }),
        },
      });
    } else if (userType === 'customer') {
      // Customers don't have a status field in the schema
      return NextResponse.json({ error: 'Cannot update customer status' }, { status: 400 });
    } else if (userType === 'tech' || userType === 'manager') {
      updated = await prisma.tech.update({
        where: { id },
        data: {
          ...(role && { role }),
        },
      });
    }

    if (!updated) {
      return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
    }

    await logAdminAction(auth.id, `Updated user ${id}`, `Type: ${userType}, Role: ${role}, Status: ${status}`);
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, userType } = await request.json();
    
    if (!id || !userType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete based on user type
    if (userType === 'shop') {
      await prisma.shop.delete({ where: { id } });
    } else if (userType === 'customer') {
      await prisma.customer.delete({ where: { id } });
    } else if (userType === 'tech' || userType === 'manager') {
      await prisma.tech.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    await logAdminAction(auth.id, `Deleted user ${id}`, `Type: ${userType}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
