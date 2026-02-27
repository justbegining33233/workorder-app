import { NextRequest, NextResponse } from 'next/server';
import { getWorkOrderById, updateWorkOrder } from '@/lib/workorders';
import { requireAuth } from '@/lib/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
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
      uploadedBy: auth.role,
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
