import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, verifyToken } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';

const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST - Admin login
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimit(rateLimitConfigs.auth)(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    const validation = await validateRequest(adminLoginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { username, password } = validation.data;

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const bcrypt = require('bcrypt');
    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: 'admin',
        isSuperAdmin: admin.isSuperAdmin,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
