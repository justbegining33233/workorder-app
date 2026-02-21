import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { checkRateLimit, getClientIP, resetRateLimit } from '@/lib/rateLimit';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
      return NextResponse.json({ error: 'deprecated - use /api/auth/reset/request and /api/auth/reset/confirm' }, { status: 410 });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
