import { Tenant } from '@/types/tenant';

// In-memory tenant store (replace with database in production)
const tenants: Tenant[] = [];

export function getAllTenants(): Tenant[] {
  return tenants;
}

export function getTenantById(id: string): Tenant | undefined {
  return tenants.find(t => t.id === id);
}

export function getTenantBySubdomain(subdomain: string): Tenant | undefined {
  return tenants.find(t => t.subdomain === subdomain);
}

export function createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Tenant {
  const newTenant: Tenant = {
    ...tenant,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  tenants.push(newTenant);
  return newTenant;
}

export function updateTenant(id: string, updates: Partial<Tenant>): Tenant | null {
  const index = tenants.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  tenants[index] = {
    ...tenants[index],
    ...updates,
    updatedAt: new Date(),
  };
  return tenants[index];
}

export function deleteTenant(id: string): boolean {
  const index = tenants.findIndex(t => t.id === id);
  if (index === -1) return false;
  tenants.splice(index, 1);
  return true;
}
