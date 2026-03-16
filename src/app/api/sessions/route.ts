import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET /api/sessions — list active sessions for the current user
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // Find sessions by matching metadata containing the user's ID
    const sessions = await prisma.refreshToken.findMany({
      where: {
        revoked: false,
        expiresAt: { gt: new Date() },
        metadata: { contains: auth.id },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        metadata: true,
      },
    });

    const mapped = sessions.map(s => {
      let parsed: Record<string, string> = {};
      try { parsed = JSON.parse(s.metadata || '{}'); } catch {}
      return {
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        ip: parsed.ip || 'unknown',
        agent: parsed.agent || 'unknown',
      };
    });

    return NextResponse.json({ sessions: mapped });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// DELETE /api/sessions — revoke a specific session or all sessions
export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const revokeAll = searchParams.get('all') === 'true';

    // Get the current session ID from the cookie to prevent self-revocation when revoking all
    const currentSessionId = request.cookies.get('refresh_id')?.value;

    if (revokeAll) {
      // Revoke all sessions except the current one
      const sessions = await prisma.refreshToken.findMany({
        where: {
          revoked: false,
          expiresAt: { gt: new Date() },
          metadata: { contains: auth.id },
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        select: { id: true },
      });

      await prisma.refreshToken.updateMany({
        where: { id: { in: sessions.map(s => s.id) } },
        data: { revoked: true, revokedAt: new Date() },
      });

      return NextResponse.json({ revoked: sessions.length });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId or all=true required' }, { status: 400 });
    }

    // Verify the session belongs to the current user
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
      select: { metadata: true, revoked: true },
    });

    if (!session || session.revoked) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify ownership
    if (!session.metadata?.includes(auth.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revoked: true, revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
