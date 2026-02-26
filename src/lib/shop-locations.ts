import { randomUUID } from 'crypto';

export interface ShopLocation {
  id: string;
  shopId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  isMain: boolean;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store — resets on server restart
const locationStore = new Map<string, ShopLocation>();

export function getLocationsByShop(shopId: string): ShopLocation[] {
  return Array.from(locationStore.values())
    .filter((l) => l.shopId === shopId)
    .sort((a, b) => {
      if (a.isMain) return -1;
      if (b.isMain) return 1;
      return a.name.localeCompare(b.name);
    });
}

export function getLocationById(id: string): ShopLocation | undefined {
  return locationStore.get(id);
}

export function createLocation(
  shopId: string,
  data: Omit<ShopLocation, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>
): ShopLocation {
  const now = new Date().toISOString();

  // If this is the first location or isMain is requested, ensure only one main
  if (data.isMain) {
    // Clear isMain from all others in same shop
    for (const [key, loc] of locationStore.entries()) {
      if (loc.shopId === shopId && loc.isMain) {
        locationStore.set(key, { ...loc, isMain: false, updatedAt: now });
      }
    }
  }

  const location: ShopLocation = {
    id: randomUUID(),
    shopId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  locationStore.set(location.id, location);
  return location;
}

export function updateLocation(
  id: string,
  data: Partial<Omit<ShopLocation, 'id' | 'shopId' | 'createdAt'>>
): ShopLocation | null {
  const existing = locationStore.get(id);
  if (!existing) return null;

  // If promoting to main, demote others
  if (data.isMain === true) {
    const now = new Date().toISOString();
    for (const [key, loc] of locationStore.entries()) {
      if (loc.shopId === existing.shopId && loc.id !== id && loc.isMain) {
        locationStore.set(key, { ...loc, isMain: false, updatedAt: now });
      }
    }
  }

  const updated: ShopLocation = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  locationStore.set(id, updated);
  return updated;
}

export function deleteLocation(id: string): boolean {
  return locationStore.delete(id);
}
