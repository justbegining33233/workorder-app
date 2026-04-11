import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer's estimates/work orders
    const estimates = await prisma.workOrder.findMany({
      where: {
        customerId: decoded.id,
        status: {
          in: ['pending', 'accepted', 'denied']
        }
      },
      include: {
        customer: true,
        shop: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match frontend expectations
    const transformedEstimates = estimates.map(estimate => ({
      id: estimate.id.toString(),
      status: estimate.status,
      service: 'Service',
      price: 0, // We'll need to add pricing logic later
      shop: estimate.shop?.shopName || 'Shop',
      description: '',
      validUntil: estimate.dueDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: estimate.createdAt.toISOString(),
    }));

    return NextResponse.json({
      estimates: transformedEstimates,
      pendingCount: transformedEstimates.filter(e => e.status === 'pending').length
    });

  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}