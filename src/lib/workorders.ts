import { WorkOrder, Message } from '@/types/workorder';

// Helper functions for localStorage
const STORAGE_KEY = 'workOrders';

function loadFromStorage(): WorkOrder[] {
  if (typeof window === 'undefined') return getDefaultWorkOrders();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultWorkOrders();
    const parsed = JSON.parse(stored) as WorkOrder[];
    // Convert date strings back to Date objects
    return parsed.map((wo: WorkOrder) => ({
      ...wo,
      createdAt: new Date(wo.createdAt),
      updatedAt: new Date(wo.updatedAt),
      messages: wo.messages?.map((m: Message) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })) || [],
      estimate: wo.estimate ? {
        ...wo.estimate,
        submittedAt: wo.estimate.submittedAt ? new Date(wo.estimate.submittedAt) : undefined
      } : null,
    }));
  } catch (error) {
    console.error('Error loading work orders from localStorage:', error);
    return getDefaultWorkOrders();
  }
}

function saveToStorage(orders: WorkOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving work orders to localStorage:', error);
  }
}

function getDefaultWorkOrders(): WorkOrder[] {
  return [];
}

// Initialize from localStorage or use defaults
const workOrders: WorkOrder[] = loadFromStorage();

export function getAllWorkOrders(): WorkOrder[] {
  return workOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getWorkOrderById(id: string): WorkOrder | undefined {
  return workOrders.find((wo) => wo.id === id);
}

export function createWorkOrder(data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): WorkOrder {
  const newWorkOrder: WorkOrder = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  workOrders.push(newWorkOrder);
  saveToStorage(workOrders);
  return newWorkOrder;
}

export function updateWorkOrder(id: string, data: Partial<WorkOrder>): WorkOrder | undefined {
  const index = workOrders.findIndex((wo) => wo.id === id);
  if (index === -1) return undefined;

  workOrders[index] = {
    ...workOrders[index],
    ...data,
    id: workOrders[index].id,
    createdAt: workOrders[index].createdAt,
    updatedAt: new Date(),
  };
  saveToStorage(workOrders);
  return workOrders[index];
}

export function deleteWorkOrder(id: string): boolean {
  const index = workOrders.findIndex((wo) => wo.id === id);
  if (index === -1) return false;
  workOrders.splice(index, 1);
  saveToStorage(workOrders);
  return true;
}
