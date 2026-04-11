import prisma from '@/lib/prisma';

export type PhotoMeta = {
  id: string;
  url: string;
  filename?: string;
  caption?: string;
  workOrderId?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
};

export async function loadPhotos(): Promise<PhotoMeta[]> {
  try {
    const rows = await prisma.photo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      filename: r.filename ?? undefined,
      caption: r.caption ?? undefined,
      workOrderId: r.workOrderId ?? null,
      uploadedBy: r.uploadedBy ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error('[photos] loadPhotos failed', err);
    return [];
  }
}

export async function addPhoto(photo: Omit<PhotoMeta, 'id' | 'createdAt'>): Promise<PhotoMeta> {
  const row = await prisma.photo.create({
    data: {
      url: photo.url,
      filename: photo.filename ?? null,
      caption: photo.caption ?? null,
      workOrderId: photo.workOrderId ?? null,
      uploadedBy: photo.uploadedBy ?? null,
    },
  });
  return {
    id: row.id,
    url: row.url,
    filename: row.filename ?? undefined,
    caption: row.caption ?? undefined,
    workOrderId: row.workOrderId ?? null,
    uploadedBy: row.uploadedBy ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
