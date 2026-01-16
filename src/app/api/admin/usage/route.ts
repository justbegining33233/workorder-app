import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // Example: usage analytics
  const customerCount = await prisma.customer.count();
  const shopCount = await prisma.shop.count();
  const techCount = await prisma.tech.count();
  const adminCount = await prisma.admin.count();
  const workOrderCounts = await prisma.workOrder.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  return NextResponse.json({
    userCounts: {
      customers: customerCount,
      shops: shopCount,
      techs: techCount,
      admins: adminCount
    },
    workOrderCounts
  });
}
