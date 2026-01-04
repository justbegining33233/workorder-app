import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // Example: aggregate work order stats
  const totalWorkOrders = await prisma.workOrder.count();
  const completedWorkOrders = await prisma.workOrder.count({ where: { status: 'completed' } });
  const pendingWorkOrders = await prisma.workOrder.count({ where: { status: 'pending' } });
  const overdueWorkOrders = await prisma.workOrder.count({ where: { status: 'pending', dueDate: { lt: new Date() } } });
  return NextResponse.json({
    totalWorkOrders,
    completedWorkOrders,
    pendingWorkOrders,
    overdueWorkOrders,
  });
}
