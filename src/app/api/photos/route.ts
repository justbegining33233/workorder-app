import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { addPhoto, loadPhotos, PhotoMeta } from '@/lib/photos';
import { requireRole } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const photos = loadPhotos();
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

    const meta: PhotoMeta = {
      id: `photo-${Date.now()}`,
      url: result.url,
      filename: (file as any).name || undefined,
      caption: caption || undefined,
      workOrderId: workOrderId || undefined,
      uploadedBy: user.id,
      createdAt: new Date().toISOString(),
    };

    addPhoto(meta);

    // If a workOrderId was provided, attach via the existing workorder photo API
    if (workOrderId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/workorders/${workOrderId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: meta.url, caption: meta.caption || '', type: 'photo' }),
        });
      } catch (err) {
      }
    }

    return NextResponse.json({ photo: meta });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
