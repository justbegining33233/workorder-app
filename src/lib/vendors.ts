import { randomUUID } from 'crypto';

export interface Vendor {
  id: string;
  shopId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  category: string; // 'parts' | 'fluids' | 'tires' | 'tools' | 'other'
  accountNumber: string;
  paymentTerms: string; // 'Net 30' | 'COD' | 'Prepaid' etc.
  rating: number; // 1-5
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory store — resets on server restart
const vendorStore = new Map<string, Vendor>();

export function getVendorsByShop(shopId: string): Vendor[] {
  return Array.from(vendorStore.values())
    .filter((v) => v.shopId === shopId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getVendorById(id: string): Vendor | undefined {
  return vendorStore.get(id);
}

export function createVendor(
  shopId: string,
  data: Omit<Vendor, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>
): Vendor {
  const now = new Date().toISOString();
  const vendor: Vendor = {
    id: randomUUID(),
    shopId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  vendorStore.set(vendor.id, vendor);
  return vendor;
}

export function updateVendor(
  id: string,
  data: Partial<Omit<Vendor, 'id' | 'shopId' | 'createdAt'>>
): Vendor | null {
  const existing = vendorStore.get(id);
  if (!existing) return null;
  const updated: Vendor = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  vendorStore.set(id, updated);
  return updated;
}

export function deleteVendor(id: string): boolean {
  return vendorStore.delete(id);
}
