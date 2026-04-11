import prisma from '@/lib/prisma';

export async function getVendorsByShop(shopId: string) {
  return prisma.vendor.findMany({
    where: { shopId },
    orderBy: { name: 'asc' },
  });
}

export async function getVendorById(id: string) {
  return prisma.vendor.findUnique({ where: { id } });
}

export async function createVendor(
  shopId: string,
  data: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    website?: string;
    category?: string;
    accountNumber?: string;
    paymentTerms?: string;
    rating?: number;
    notes?: string;
    isActive?: boolean;
  }
) {
  return prisma.vendor.create({ data: { shopId, ...data } });
}

export async function updateVendor(
  id: string,
  data: Record<string, unknown>
) {
  return prisma.vendor.update({ where: { id }, data });
}

export async function deleteVendor(id: string) {
  await prisma.vendor.delete({ where: { id } });
  return true;
}
