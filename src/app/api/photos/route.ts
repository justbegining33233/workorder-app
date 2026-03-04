import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { addPhoto, loadPhotos, PhotoMeta } from '@/lib/photos';
import { requireRole } from '@/lib/auth';
import { updateWorkOrder, getWorkOrderById } from '@/lib/workorders';
import type { AuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin', 'tech']);
  if (auth instanceof NextResponse) return auth;

  try {
    const photos = await loadPhotos();
    return NextResponse.json({ photos });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ photos: [] });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin', 'tech']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const caption = (formData.get('caption') as string) || '';
    const workOrderId = (formData.get('workOrderId') as string) || null;

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, 'photos');

    const meta = await addPhoto({
      url: result.url,
      filename: (file as any).name || undefined,
      caption: caption || undefined,
      workOrderId: workOrderId || undefined,
      uploadedBy: user.id,
    });

    // If a workOrderId was provided, append photo to workOrder.workPhotos directly
    if (workOrderId) {
      try {
        const workOrder = await getWorkOrderById(workOrderId);
        if (workOrder) {
          const workPhotos = [
            ...((workOrder.workPhotos as unknown[]) || []),
            {
              id: meta.id,
              url: meta.url,
              type: 'photo',
              caption: meta.caption || '',
              uploadedAt: meta.createdAt,
              uploadedBy: user.id,
            },
          ];
          await updateWorkOrder(workOrderId, { workPhotos: workPhotos as any });
        }
      } catch (err) {
        console.error('[photos] Failed to attach photo to work order', err);
      }
    }

    return NextResponse.json({ photo: meta });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
