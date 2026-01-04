import { WorkOrder } from '@/types/workorder';

// Client-side localStorage operations
const STORAGE_KEY = 'workOrders';


export function loadWorkOrdersFromStorage(): WorkOrder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return parsed.map((wo: any) => ({
      ...wo,
      createdAt: new Date(wo.createdAt),
      updatedAt: new Date(wo.updatedAt),
      messages: wo.messages?.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })) || [],
      estimate: wo.estimate ? {
        ...wo.estimate,
        submittedAt: new Date(wo.estimate.submittedAt)
      } : null,
    }));
  } catch (error) {
    console.error('Error loading work orders from localStorage:', error);
    return [];
  }
}

export function saveWorkOrdersToStorage(orders: WorkOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving work orders to localStorage:', error);
  }
}

export function getWorkOrderByIdClient(id: string): WorkOrder | undefined {
  const orders = loadWorkOrdersFromStorage();
  return orders.find((wo) => wo.id === id);
}

export function getAllWorkOrdersClient(): WorkOrder[] {
  const orders = loadWorkOrdersFromStorage();
  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createWorkOrderClient(data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): WorkOrder {
  const orders = loadWorkOrdersFromStorage();
  const newWorkOrder: WorkOrder = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  orders.push(newWorkOrder);
  saveWorkOrdersToStorage(orders);
  return newWorkOrder;
}

export function updateWorkOrderClient(id: string, data: Partial<WorkOrder>): WorkOrder | undefined {
  const orders = loadWorkOrdersFromStorage();
  const index = orders.findIndex((wo) => wo.id === id);
  if (index === -1) return undefined;

  orders[index] = {
    ...orders[index],
    ...data,
    id: orders[index].id,
    createdAt: orders[index].createdAt,
    updatedAt: new Date(),
  };
  saveWorkOrdersToStorage(orders);
  return orders[index];
}

export function deleteWorkOrderClient(id: string): boolean {
  const orders = loadWorkOrdersFromStorage();
  const index = orders.findIndex((wo) => wo.id === id);
  if (index === -1) return false;
  orders.splice(index, 1);
  saveWorkOrdersToStorage(orders);
  return true;
}
