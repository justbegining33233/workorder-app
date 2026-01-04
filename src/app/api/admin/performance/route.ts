import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // Example: performance tracking
  const start = Date.now();
  await prisma.workOrder.count();
  const end = Date.now();
  return NextResponse.json({ apiResponseTimeMs: end - start });
}
