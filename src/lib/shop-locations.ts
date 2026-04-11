import prisma from '@/lib/prisma';

export async function getLocationsByShop(shopId: string) {
  return prisma.shopLocation.findMany({
    where: { shopId },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  });
}

export async function getLocationById(id: string) {
  return prisma.shopLocation.findUnique({ where: { id } });
}

export async function createLocation(
  shopId: string,
  data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
    isMain?: boolean;
    status?: string;
    notes?: string;
  }
) {
  // If promoting to main, demote others first
  if (data.isMain) {
    await prisma.shopLocation.updateMany({
      where: { shopId, isMain: true },
      data: { isMain: false },
    });
  }
  return prisma.shopLocation.create({ data: { shopId, ...data } });
}

export async function updateLocation(
  id: string,
  data: Record<string, unknown>
) {
  // If promoting to main, demote others first
  if (data.isMain === true) {
    const existing = await prisma.shopLocation.findUnique({ where: { id } });
    if (existing) {
      await prisma.shopLocation.updateMany({
        where: { shopId: existing.shopId, isMain: true, NOT: { id } },
        data: { isMain: false },
      });
    }
  }
  return prisma.shopLocation.update({ where: { id }, data });
}

export async function deleteLocation(id: string) {
  await prisma.shopLocation.delete({ where: { id } });
  return true;
}
