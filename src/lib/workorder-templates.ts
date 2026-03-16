import prisma from '@/lib/prisma';

export async function getTemplatesByShop(shopId: string) {
  return prisma.workOrderTemplate.findMany({
    where: { shopId },
    orderBy: { name: 'asc' },
  });
}

export async function getTemplateById(id: string) {
  return prisma.workOrderTemplate.findUnique({ where: { id } });
}

export async function createTemplate(
  shopId: string,
  data: {
    name: string;
    serviceType?: string;
    description?: string;
    repairs?: string[];
    maintenance?: string[];
    estimatedCost?: number;
    laborHours?: number;
    notes?: string;
  }
) {
  return prisma.workOrderTemplate.create({ data: { shopId, ...data } });
}

export async function updateTemplate(
  id: string,
  data: Record<string, unknown>
) {
  return prisma.workOrderTemplate.update({ where: { id }, data });
}

export async function deleteTemplate(id: string) {
  await prisma.workOrderTemplate.delete({ where: { id } });
  return true;
}
