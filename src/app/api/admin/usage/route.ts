import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // Example: usage analytics
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });
  const workOrderCounts = await prisma.workOrder.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  return NextResponse.json({ userCounts, workOrderCounts });
}
