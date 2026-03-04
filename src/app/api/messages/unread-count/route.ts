import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/messages/unread-count
// Returns the number of unread direct messages for the authenticated user.
// Response: { count: number }
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const count = await prisma.directMessage.count({
      where: {
        receiverId: decoded.id,
        receiverRole: decoded.role,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
