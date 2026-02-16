import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // If DB isn't configured, return a safe placeholder (prevents build-time failures)
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ apiResponseTimeMs: null, warning: 'DATABASE_URL not configured' }, { status: 503 });
  }

  try {
    const start = Date.now();
    await prisma.workOrder.count();
    const end = Date.now();
    return NextResponse.json({ apiResponseTimeMs: end - start });
  } catch (err) {
    console.error('Error in /api/admin/performance:', err);
    return NextResponse.json({ error: 'Failed to read performance' }, { status: 500 });
  }
}
