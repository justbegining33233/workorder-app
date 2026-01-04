import { NextRequest, NextResponse } from 'next/server';
import { validatePublicCsrf } from '@/lib/csrf';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).optional(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate public CSRF token (double-submit)
    const ok = validatePublicCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    const body = await request.json();
    const data = registerSchema.parse(body);
    
    // Check if customer exists
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.username ? [{ username: data.username }] : [])
        ]
      },
    });
    
    if (existing) {
      if (existing.email === data.email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
      if (existing.username === data.username) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        company: data.company,
      },
    });
    
    // Send welcome email (don't await to not block response)
    sendWelcomeEmail(customer.email, customer.firstName).catch(console.error);
    
    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
