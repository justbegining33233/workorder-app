import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// @ts-ignore
import { verifyToken } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sos_auth')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await (prisma as any).refreshToken.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const out = sessions.map((s: any) => ({
      id: s.id,
      adminId: s.adminId,
      metadata: s.metadata,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));

    return NextResponse.json({ sessions: out });
  } catch (err) {
    console.error('Sessions list error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // CSRF protection
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });

    const token = request.cookies.get('sos_auth')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await (prisma as any).refreshToken.delete({ where: { id } }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sessions delete error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
