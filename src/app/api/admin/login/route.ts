import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST - Admin login
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimit(rateLimitConfigs.auth)(request);
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
    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('FATAL: JWT_SECRET is not set — refusing to sign admin token');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: 'admin',
        isSuperAdmin: admin.isSuperAdmin,
      },
      jwtSecret,
      { expiresIn: '24h' }
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
