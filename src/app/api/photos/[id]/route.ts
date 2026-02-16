import { NextRequest, NextResponse } from 'next/server';
import { loadPhotos, savePhotos } from '@/lib/photos';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const photos = loadPhotos();
    const idx = photos.findIndex(p => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    photos[idx] = { ...photos[idx], ...body };
    savePhotos(photos);
    return NextResponse.json({ photo: photos[idx] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const photos = loadPhotos();
    const remaining = photos.filter(p => p.id !== id);
    savePhotos(remaining);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
