import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers/documents - Get all documents for a customer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const documents = await prisma.customerDocument.findMany({
      where: { customerId },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST /api/customers/documents - Upload a new document
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, name, type, url, fileSize, workOrderId } = body;

    if (!customerId || !name || !url) {
      return NextResponse.json(
        { error: 'Customer ID, name, and URL are required' },
        { status: 400 }
      );
    }

    const document = await prisma.customerDocument.create({
      data: {
        customerId,
        name,
        type: type || 'other',
        url,
        fileSize: fileSize || 0,
        workOrderId,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
