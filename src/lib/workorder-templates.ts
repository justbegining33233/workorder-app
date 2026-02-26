import { randomUUID } from 'crypto';

export interface WorkOrderTemplate {
  id: string;
  shopId: string;
  name: string;
  serviceType: string;
  description: string;
  repairs: string[];
  maintenance: string[];
  estimatedCost: number;
  laborHours: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store — resets on server restart
const templateStore = new Map<string, WorkOrderTemplate>();

export function getTemplatesByShop(shopId: string): WorkOrderTemplate[] {
  return Array.from(templateStore.values())
    .filter((t) => t.shopId === shopId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTemplateById(id: string): WorkOrderTemplate | undefined {
  return templateStore.get(id);
}

export function createTemplate(
  shopId: string,
  data: Omit<WorkOrderTemplate, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>
): WorkOrderTemplate {
  const now = new Date().toISOString();
  const template: WorkOrderTemplate = {
    id: randomUUID(),
    shopId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  templateStore.set(template.id, template);
  return template;
}

export function updateTemplate(
  id: string,
  data: Partial<Omit<WorkOrderTemplate, 'id' | 'shopId' | 'createdAt'>>
): WorkOrderTemplate | null {
  const existing = templateStore.get(id);
  if (!existing) return null;
  const updated: WorkOrderTemplate = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  templateStore.set(id, updated);
  return updated;
}

export function deleteTemplate(id: string): boolean {
  return templateStore.delete(id);
}

// Seed with some useful common templates
function seedTemplates() {
  const shopId = '__demo__';
  const demos: Omit<WorkOrderTemplate, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Oil Change - Standard',
      serviceType: 'oil-change',
      description: 'Conventional oil change with filter replacement',
      repairs: [],
      maintenance: ['Oil Change', 'Oil Filter Replacement'],
      estimatedCost: 49.99,
      laborHours: 0.5,
      notes: 'Use conventional 5W-30 unless otherwise specified',
    },
    {
      name: 'Brake Service - Full',
      serviceType: 'brake-service',
      description: 'Replace front and rear brake pads + rotor inspection',
      repairs: ['Brake Pad Replacement (Front)', 'Brake Pad Replacement (Rear)'],
      maintenance: ['Brake Fluid Check'],
      estimatedCost: 249.99,
      laborHours: 2.5,
      notes: 'Inspect rotors for wear; replace if under minimum thickness',
    },
    {
      name: 'Annual Inspection',
      serviceType: 'inspection',
      description: 'Full vehicle inspection with 50-point checklist',
      repairs: [],
      maintenance: ['50-Point Inspection', 'Tire Pressure Check', 'Fluid Level Check'],
      estimatedCost: 89.99,
      laborHours: 1.5,
      notes: 'Provide customer with inspection report',
    },
  ];
  demos.forEach((d) => createTemplate(shopId, d));
}

seedTemplates();
