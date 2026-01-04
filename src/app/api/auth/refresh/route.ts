import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

// @ts-ignore
import { generateAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Support new split cookies (`refresh_id` + `refresh_sig`) and legacy `refresh_token` cookie
    let id = request.cookies.get('refresh_id')?.value;
    let raw = request.cookies.get('refresh_sig')?.value;
    if ((!id || !raw) && request.cookies.get('refresh_token')?.value) {
      const legacy = request.cookies.get('refresh_token')!.value;
      const parts = legacy.split(':');
      id = parts[0] || id;
      raw = parts[1] || raw;
    }
    if (!id || !raw) return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    const record = await (prisma as any).refreshToken.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });

    if (record.expiresAt < new Date()) {
      // expired - remove and reject
      await (prisma as any).refreshToken.delete({ where: { id } }).catch(() => {});
      return NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });
    }

    const match = await bcrypt.compare(raw, record.tokenHash);

    // If the token id exists but the raw doesn't match, treat as possible theft.
    if (!match) {
      try {
        // Revoke all sessions for this owner (adminId or metadata)
        if (record.adminId) {
          await (prisma as any).refreshToken.deleteMany({ where: { adminId: record.adminId } }).catch(() => {});
        } else if (record.metadata) {
          // metadata may have customerId, shopId, techId
          const meta = record.metadata as any;
          const whereAny: any = { OR: [] };
          if (meta.customerId) whereAny.OR.push({ metadata: { path: ['customerId'], equals: meta.customerId } });
          if (meta.shopId) whereAny.OR.push({ metadata: { path: ['shopId'], equals: meta.shopId } });
          if (meta.techId) whereAny.OR.push({ metadata: { path: ['techId'], equals: meta.techId } });
          if (whereAny.OR.length) await (prisma as any).refreshToken.deleteMany({ where: whereAny }).catch(() => {});
        }
      } catch (e) {
        // ignore errors during cleanup
      }
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // Token matched: rotate - create new refresh token and delete old one
    const origin = request.headers.get('x-forwarded-for') || request.headers.get('host') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const newRaw = (await import('@/lib/auth')).generateRandomToken(48);
    const newHash = await bcrypt.hash(newRaw, 12);
    const newExpires = (await import('@/lib/auth')).refreshExpiryDate();
    const csrf = (await import('@/lib/csrf')).generateCsrfToken();

    const newRecord = await (prisma as any).refreshToken.create({
      data: {
        tokenHash: newHash,
        adminId: record.adminId || null,
        metadata: { ...(record.metadata || {}), lastIp: origin, lastAgent: userAgent, csrfToken: csrf },
        expiresAt: newExpires,
      }
    });

    // delete old
    await (prisma as any).refreshToken.delete({ where: { id } }).catch(() => {});

    // Build payload based on owner
    let payload: any = { role: 'unknown' };
    if (record.adminId) {
      const admin = await prisma.admin.findUnique({ where: { id: record.adminId } });
      if (!admin) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      payload = { id: admin.id, username: admin.username, role: 'admin' };
    } else if (record.metadata) {
      const meta = record.metadata as any;
      if (meta.customerId) {
        const c = await prisma.customer.findUnique({ where: { id: meta.customerId } });
        if (!c) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        payload = { id: c.id, username: c.email, role: 'customer' };
      } else if (meta.shopId) {
        const s = await prisma.shop.findUnique({ where: { id: meta.shopId } });
        if (!s) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        payload = { id: s.id, username: s.username, role: 'shop' };
      } else if (meta.techId) {
        const t = await prisma.tech.findUnique({ where: { id: meta.techId } });
        if (!t) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        payload = { id: t.id, username: t.email, role: t.role };
      }
    }

    const accessToken = (await import('@/lib/auth')).generateAccessToken(payload);

    const response = NextResponse.json({ accessToken });
    // set new refresh cookie
    const cookieValue = `${newRecord.id}:${newRaw}`;
    response.cookies.set('refresh_id', newRecord.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor((newExpires.getTime() - Date.now()) / 1000),
    });
    response.cookies.set('refresh_sig', newRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor((newExpires.getTime() - Date.now()) / 1000),
    });
    // expose CSRF token for client
    response.cookies.set('csrf_token', csrf, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor((newExpires.getTime() - Date.now()) / 1000),
    });
    // set access cookie
    response.cookies.set('sos_auth', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 15,
    });
    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
