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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100') || 100, 500);

    const userId = decoded.id;
    const userRole = decoded.role;

    // Build query to get messages where user is sender OR receiver
    const where: any = {
      OR: [
        { senderId: userId, senderRole: userRole },
        { receiverId: userId, receiverRole: userRole },
      ],
    };

    // Filter by contact role if specified (only applied when contactId is NOT given)
    if (contactRole && !contactId) {
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
      const contactConditions: any[] = [
        { senderId: userId, senderRole: userRole, receiverId: contactId },
        { receiverId: userId, receiverRole: userRole, senderId: contactId },
      ];
      // If a specific contact role was also supplied, further narrow the thread
      if (contactRole) {
        contactConditions[0].receiverRole = contactRole;
        contactConditions[1].senderRole = contactRole;
      }
      where.AND = [{ OR: contactConditions }];
    }

    const messages = await prisma.directMessage.findMany({
      where,
      orderBy: { createdAt: contactId ? 'asc' : 'desc' },
      // When fetching a specific conversation, return the full history (no cap).
      // For the conversation list view, fetch the latest `limit` messages.
      ...(contactId ? {} : { take: limit }),
    });

    // Group messages into conversations
    const conversations = new Map();
    const missingShopIds = new Set<string>();
    
    messages.forEach((msg) => {
      // Determine the "other party"; for customers, normalize by shopId to keep a single thread per shop
      const isRecipient = msg.receiverId === userId;
      let otherId = isRecipient ? msg.senderId : msg.receiverId;
      let otherRole = isRecipient ? msg.senderRole : msg.receiverRole;
      let otherName = isRecipient ? msg.senderName : msg.receiverName;

      // For customers: only collapse messages that are explicitly to/from the 'shop' role into a
      // single shop-level thread.  Direct messages to a specific tech or manager are kept as
      // their own conversation threads so the customer can address each person individually.
      if (userRole === 'customer' && msg.shopId && (otherRole === 'shop')) {
        otherId = msg.shopId;
        otherRole = 'shop';
        if (msg.receiverRole === 'shop') otherName = msg.receiverName;
        else if (msg.senderRole === 'shop') otherName = msg.senderName;
        if (!otherName || otherName === 'Shop') {
          missingShopIds.add(msg.shopId);
          otherName = otherName || 'Shop';
        }
      }
      
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
          shopId: msg.shopId,
        });
      }
      
      const conv = conversations.get(conversationKey);
      conv.messages.push(msg);
      
      // Count unread messages (where current user is receiver and message is unread)
      if (msg.receiverId === userId && !msg.isRead) {
        conv.unreadCount++;
      }
    });

    // Fill in shop names if missing
    if (missingShopIds.size > 0) {
      const shops = await prisma.shop.findMany({
        where: { id: { in: Array.from(missingShopIds) } },
        select: { id: true, shopName: true },
      });
      const lookup = new Map(shops.map((s) => [s.id, s.shopName]));
      conversations.forEach((conv) => {
        if (conv.shopId && lookup.has(conv.shopId)) {
          conv.contactName = lookup.get(conv.shopId) || conv.contactName;
        }
      });
    }

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

    const VALID_ROLES = ['customer', 'shop', 'manager', 'tech', 'admin'];
    if (!receiverId || !receiverRole || !receiverName || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: receiverId, receiverRole, receiverName, messageBody' },
        { status: 400 }
      );
    }
    if (!VALID_ROLES.includes(receiverRole)) {
      return NextResponse.json({ error: 'Invalid receiverRole' }, { status: 400 });
    }
    const trimmedBody = String(messageBody).trim();
    if (!trimmedBody) {
      return NextResponse.json({ error: 'Message body cannot be empty' }, { status: 400 });
    }
    if (trimmedBody.length > 5000) {
      return NextResponse.json({ error: 'Message body exceeds 5000 character limit' }, { status: 400 });
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

    // Ensure shop receiver names use the actual shop name
    let normalizedReceiverName = receiverName;
    if (receiverRole === 'shop') {
      const shop = await prisma.shop.findUnique({
        where: { id: receiverId },
        select: { shopName: true },
      });
      if (shop?.shopName) {
        normalizedReceiverName = shop.shopName;
        shopId = shopId || receiverId;
      }
    }

    // Route customer → shop messages: deliver to shop owner and also to the shop's manager (if any)
    const targets: { id: string; role: string; name: string }[] = [
      { id: receiverId, role: receiverRole, name: normalizedReceiverName },
    ];

    if (senderRole === 'customer' && receiverRole === 'shop') {
      shopId = receiverId; // preserve shop context for all copies
      const manager = await prisma.tech.findFirst({
        where: { shopId: receiverId, role: 'manager' },
        select: { id: true, firstName: true, lastName: true },
      });

      if (manager) {
        targets.push({
          id: manager.id,
          role: 'manager',
          name: `${manager.firstName} ${manager.lastName}`,
        });
      }
    }

    // When a customer messages a tech or manager directly, resolve their shopId so that
    // conversations can be scoped to the correct shop on both sides.
    if (senderRole === 'customer' && (receiverRole === 'tech' || receiverRole === 'manager')) {
      if (!shopId) {
        const staff = await prisma.tech.findUnique({
          where: { id: receiverId },
          select: { shopId: true },
        });
        if (staff) shopId = staff.shopId;
      }
    }

    const created = await Promise.all(targets.map((t) =>
      prisma.directMessage.create({
        data: {
          senderId,
          senderRole,
          senderName,
          receiverId: t.id,
          receiverRole: t.role,
          receiverName: t.name,
          subject: subject || null,
          body: trimmedBody,
          shopId,
          threadId: threadId || null,
        },
      })
    ));

    return NextResponse.json({ message: created[0], copies: created.length, success: true });
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
