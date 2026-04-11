import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check endpoint
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}
