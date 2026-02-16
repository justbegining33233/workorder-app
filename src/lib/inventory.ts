export interface InventoryPart {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number; // unit price
}

export interface LaborRate {
  id: string;
  name: string;
  rate: number; // per hour
}

const parts: InventoryPart[] = [
  { id: 'p1', name: 'Radiator', sku: 'RAD-001', quantity: 5, price: 320 },
  { id: 'p2', name: 'All-season tire', sku: 'TIRE-ALL-17', quantity: 24, price: 110 },
];

const laborRates: LaborRate[] = [
  { id: 'l1', name: 'Standard shop rate', rate: 120 },
  { id: 'l2', name: 'After-hours rate', rate: 160 },
];

export function getInventory() {
  return { parts, laborRates };
}

export function addPart(input: Omit<InventoryPart, 'id'>): InventoryPart {
  const part: InventoryPart = { ...input, id: Date.now().toString(36) };
  parts.push(part);
  return part;
}

export function deletePart(id: string) {
  const idx = parts.findIndex((p) => p.id === id);
  if (idx >= 0) parts.splice(idx, 1);
}

export function addLaborRate(input: Omit<LaborRate, 'id'>): LaborRate {
  const rate: LaborRate = { ...input, id: Date.now().toString(36) };
  laborRates.push(rate);
  return rate;
}

export function deleteLaborRate(id: string) {
  const idx = laborRates.findIndex((r) => r.id === id);
  if (idx >= 0) laborRates.splice(idx, 1);
}

export function updatePart(id: string, input: Partial<Omit<InventoryPart, 'id'>>): InventoryPart | null {
  const idx = parts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    parts[idx] = { ...parts[idx], ...input };
    return parts[idx];
  }
  return null;
}

export function updateLaborRate(id: string, input: Partial<Omit<LaborRate, 'id'>>): LaborRate | null {
  const idx = laborRates.findIndex((r) => r.id === id);
  if (idx >= 0) {
    laborRates[idx] = { ...laborRates[idx], ...input };
    return laborRates[idx];
  }
  return null;
}
