import { NextRequest, NextResponse } from 'next/server';
import { getWorkOrderById, updateWorkOrder } from '@/lib/workorders';
import { validateCsrf } from '@/lib/csrf';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // If no Authorization header then require CSRF
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { id } = await params;
    const { url, type, caption } = await request.json();

    const workOrder = await getWorkOrderById(id);
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const photo = {
      id: `photo-${Date.now()}`,
      url,
      type,
      uploadedAt: new Date(),
      uploadedBy: request.headers.get('x-user-role') || 'tech',
      caption,
    };

    const workPhotos = [...(workOrder.workPhotos || []), photo];
    const updated = updateWorkOrder(id, { workPhotos });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
