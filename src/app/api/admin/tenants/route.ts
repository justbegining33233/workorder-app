import { NextResponse } from 'next/server';

// Mock tenant data
const mockTenants: {
  id: string;
  name: string;
  status: string;
  workOrders: number;
  revenue: number;
  createdAt: string;
}[] = [];

export async function GET() {
  return NextResponse.json(mockTenants);
}
