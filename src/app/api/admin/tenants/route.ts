import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

// Mock tenant data
const mockTenants: {
  id: string;
  name: string;
  status: string;
  workOrders: number;
  revenue: number;
  createdAt: string;
}[] = [];

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(mockTenants);
}
