import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashTokenSha256 } from '@/lib/verification';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.identifier; // username or email
    const rawToken = body.token;
    const newPassword = body.password;
    const type = body.type || 'password_reset';

    if (!identifier || !rawToken || !newPassword) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

    const tokenHash = hashTokenSha256(rawToken);

    // Find matching token
    const rec = await prisma.verificationToken.findFirst({ where: { tokenHash, type } });
    if (!rec || rec.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

    // Resolve user
    let userModel: 'admin'|'shop'|'customer'|'tech'|null = null;
    let user: any = null;
    user = await prisma.admin.findUnique({ where: { username: identifier } }); if (user) userModel = 'admin';
    if (!user) { user = await prisma.shop.findUnique({ where: { username: identifier } }); if (user) userModel = 'shop'; }
    if (!user) { user = await prisma.customer.findUnique({ where: { email: identifier } }); if (user) userModel = 'customer'; }
    if (!user) { user = await prisma.tech.findUnique({ where: { email: identifier } }); if (user) userModel = 'tech'; }

    if (!user || user.id !== rec.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

    // Update password — Prisma middleware will hash the password
    if (userModel === 'admin') {
      await prisma.admin.update({ where: { id: user.id }, data: { password: newPassword } });
    } else if (userModel === 'shop') {
      await prisma.shop.update({ where: { id: user.id }, data: { password: newPassword } });
    } else if (userModel === 'customer') {
      await prisma.customer.update({ where: { id: user.id }, data: { password: newPassword } });
    } else if (userModel === 'tech') {
      await prisma.tech.update({ where: { id: user.id }, data: { password: newPassword } });
    }

    // Delete token record
    await prisma.verificationToken.delete({ where: { id: rec.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset confirm error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
