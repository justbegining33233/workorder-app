import { randomUUID } from 'crypto';

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export type RecurringStatus = 'active' | 'paused' | 'cancelled';

export interface RecurringAppointment {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  vehicleInfo: string;
  serviceType: string;
  frequency: RecurringFrequency;
  nextRunAt: string;      // ISO date string
  lastRunAt: string | null;
  notes: string;
  status: RecurringStatus;
  createdAt: string;
  updatedAt: string;
}

// In-memory store — resets on server restart
const recurringStore = new Map<string, RecurringAppointment>();

/** Calculate next run date from a given date and frequency */
export function calcNextRunDate(from: string, frequency: RecurringFrequency): string {
  const d = new Date(from);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'annually':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString();
}

export function getRecurringByShop(shopId: string): RecurringAppointment[] {
  return Array.from(recurringStore.values())
    .filter((r) => r.shopId === shopId)
    .sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt));
}

export function getRecurringById(id: string): RecurringAppointment | undefined {
  return recurringStore.get(id);
}

export function createRecurring(
  shopId: string,
  data: Omit<RecurringAppointment, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>
): RecurringAppointment {
  const now = new Date().toISOString();
  const appt: RecurringAppointment = {
    id: randomUUID(),
    shopId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  recurringStore.set(appt.id, appt);
  return appt;
}

export function updateRecurring(
  id: string,
  data: Partial<Omit<RecurringAppointment, 'id' | 'shopId' | 'createdAt'>>
): RecurringAppointment | null {
  const existing = recurringStore.get(id);
  if (!existing) return null;
  const updated: RecurringAppointment = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  recurringStore.set(id, updated);
  return updated;
}

export function deleteRecurring(id: string): boolean {
  return recurringStore.delete(id);
}
