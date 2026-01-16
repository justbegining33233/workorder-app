import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers/messages - Get all messages for a customer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const workOrderId = searchParams.get('workOrderId');

    if (!customerId && !workOrderId) {
      return NextResponse.json(
        { error: 'Customer ID or Work Order ID required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (workOrderId) where.workOrderId = workOrderId;

    const messages = await prisma.customerMessage.findMany({
      where,
      orderBy: { sentAt: 'asc' },
      include: {
        workOrder: {
          select: {
            id: true,
            issueDescription: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/customers/messages - Send a new message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, workOrderId, from, content } = body;

    if (!customerId || !workOrderId || !from || !content) {
      return NextResponse.json(
        { error: 'Customer ID, Work Order ID, from, and content are required' },
        { status: 400 }
      );
    }

    const message = await prisma.customerMessage.create({
      data: {
        customerId,
        workOrderId,
        from, // 'customer' or 'tech'
        content,
        read: from === 'customer', // Mark customer messages as read by default
        sentAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PATCH /api/customers/messages - Mark messages as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Message IDs array required' }, { status: 400 });
    }

    await prisma.customerMessage.updateMany({
      where: { id: { in: messageIds } },
      data: { read: true },
    });

    return NextResponse.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json({ error: 'Failed to update messages' }, { status: 500 });
  }
}
