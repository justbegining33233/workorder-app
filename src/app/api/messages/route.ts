import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Fetch messages/conversations for the logged-in user
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

    const { searchParams } = new URL(request.url);
    const contactRole = searchParams.get('role'); // Filter by contact role
    const contactId = searchParams.get('contactId'); // Get conversation with specific contact
    const limit = parseInt(searchParams.get('limit') || '100');

    const userId = decoded.id;
    const userRole = decoded.role;

    // Build query to get messages where user is sender OR receiver
    const where: any = {
      OR: [
        { senderId: userId, senderRole: userRole },
        { receiverId: userId, receiverRole: userRole },
      ],
    };

    // Filter by contact role if specified
    if (contactRole) {
      where.AND = [
        {
          OR: [
            { senderRole: contactRole },
            { receiverRole: contactRole },
          ],
        },
      ];
    }

    // Filter by specific contact if specified
    if (contactId) {
      // SECURITY: Verify user has permission to view this conversation
      // Only allow if user is part of the conversation
      where.AND = [
        {
          OR: [
            {
              senderId: userId,
              senderRole: userRole,
              receiverId: contactId,
            },
            {
              receiverId: userId,
              receiverRole: userRole,
              senderId: contactId,
            },
          ],
        },
      ];
    }

    const messages = await prisma.directMessage.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Group messages into conversations
    const conversations = new Map();
    
    messages.forEach((msg) => {
      // Determine the "other person" in the conversation
      const isRecipient = msg.receiverId === userId;
      const otherId = isRecipient ? msg.senderId : msg.receiverId;
      const otherRole = isRecipient ? msg.senderRole : msg.receiverRole;
      const otherName = isRecipient ? msg.senderName : msg.receiverName;
      
      const conversationKey = `${otherRole}_${otherId}`;
      
      if (!conversations.has(conversationKey)) {
        conversations.set(conversationKey, {
          contactId: otherId,
          contactRole: otherRole,
          contactName: otherName,
          lastMessage: msg.body,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
          messages: [],
        });
      }
      
      const conv = conversations.get(conversationKey);
      conv.messages.push(msg);
      
      // Count unread messages (where current user is receiver and message is unread)
      if (msg.receiverId === userId && !msg.isRead) {
        conv.unreadCount++;
      }
    });

    // Convert to array and sort by last message time
    const conversationsArray = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    // Get unread counts by role
    const unreadByRole = {
      tech: 0,
      manager: 0,
      admin: 0,
      customer: 0,
      shop: 0,
    };

    conversationsArray.forEach((conv) => {
      if (conv.unreadCount > 0 && unreadByRole[conv.contactRole as keyof typeof unreadByRole] !== undefined) {
        unreadByRole[conv.contactRole as keyof typeof unreadByRole] += conv.unreadCount;
      }
    });

    return NextResponse.json({
      conversations: conversationsArray,
      unreadByRole,
      totalUnread: Object.values(unreadByRole).reduce((sum, count) => sum + count, 0),
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      receiverId,
      receiverRole,
      receiverName,
      subject,
      messageBody,
      threadId,
    } = body;

    if (!receiverId || !receiverRole || !receiverName || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: receiverId, receiverRole, receiverName, messageBody' },
        { status: 400 }
      );
    }

    const senderId = decoded.id;
    const senderRole = decoded.role;
    
    // Get sender name from database
    let senderName = '';
    let shopId = null;

    if (senderRole === 'manager' || senderRole === 'tech') {
      const tech = await prisma.tech.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true, shopId: true },
      });
      if (tech) {
        senderName = `${tech.firstName} ${tech.lastName}`;
        shopId = tech.shopId;
      }
    } else if (senderRole === 'customer') {
      const customer = await prisma.customer.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });
      if (customer) {
        senderName = `${customer.firstName} ${customer.lastName}`;
      }
    } else if (senderRole === 'shop') {
      const shop = await prisma.shop.findUnique({
        where: { id: senderId },
        select: { shopName: true },
      });
      if (shop) {
        senderName = shop.shopName;
        shopId = senderId;
      }
    } else if (senderRole === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: senderId },
        select: { username: true },
      });
      if (admin) {
        senderName = admin.username;
      }
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId,
        senderRole,
        senderName,
        receiverId,
        receiverRole,
        receiverName,
        subject: subject || null,
        body: messageBody,
        shopId,
        threadId: threadId || null,
      },
    });

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds, contactId, contactRole } = body;

    const userId = decoded.id;

    // Mark specific messages as read
    if (messageIds && Array.isArray(messageIds)) {
      await prisma.directMessage.updateMany({
        where: {
          id: { in: messageIds },
          receiverId: userId, // Only mark messages where current user is receiver
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }
    // Mark all messages from a specific contact as read
    else if (contactId && contactRole) {
      await prisma.directMessage.updateMany({
        where: {
          receiverId: userId,
          senderId: contactId,
          senderRole: contactRole,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
