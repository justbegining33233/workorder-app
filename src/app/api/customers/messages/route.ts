import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/middleware';

// GET /api/customers/messages - Get all messages for a customer
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workOrderId = searchParams.get('workOrderId');

    const where: any = { customerId: user.id };
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

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/customers/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workOrderId, appointmentId, content } = body;

    if ((!workOrderId && !appointmentId) || !content) {
      return NextResponse.json(
        { error: 'Work Order ID or Appointment ID and content are required' },
        { status: 400 }
      );
    }

    const data: any = {
      customerId: user.id,
      from: 'customer',
      content,
      read: true, // Mark customer messages as read by default
      sentAt: new Date(),
    };

    if (workOrderId) data.workOrderId = workOrderId;
    if (appointmentId) data.appointmentId = appointmentId;

    const message = await prisma.customerMessage.create({
      data,
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
