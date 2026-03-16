import prisma from '@/lib/prisma';

export async function getAllTenants() {
  return prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({ where: { id } });
}

export async function getTenantBySubdomain(subdomain: string) {
  return prisma.tenant.findUnique({ where: { subdomain } });
}

export async function createTenant(data: {
  companyName: string;
  subdomain: string;
  contactEmail: string;
  contactPhone: string;
  logo?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  plan?: string;
  maxUsers?: number;
  maxWorkOrders?: number;
  timezone?: string;
  currency?: string;
}) {
  return prisma.tenant.create({ data });
}

export async function updateTenant(id: string, updates: Record<string, unknown>) {
  return prisma.tenant.update({ where: { id }, data: updates });
}

export async function deleteTenant(id: string) {
  await prisma.tenant.delete({ where: { id } });
  return true;
}
