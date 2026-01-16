import { WorkOrder, Message } from '@/types/workorder';

// API-based functions for work orders
const API_BASE = '/api/workorders';

export async function getAllWorkOrders(): Promise<WorkOrder[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(API_BASE, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch work orders');
    const data = await response.json();
    return data.workOrders || [];
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return [];
  }
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch work order');
    const data = await response.json();
    return data.workOrder || null;
  } catch (error) {
    console.error('Error fetching work order:', error);
    return null;
  }
}

export async function createWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(workOrder),
    });
    if (!response.ok) throw new Error('Failed to create work order');
    const data = await response.json();
    return data.workOrder || null;
  } catch (error) {
    console.error('Error creating work order:', error);
    return null;
  }
}

export async function updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update work order');
    const data = await response.json();
    return data.workOrder || null;
  } catch (error) {
    console.error('Error updating work order:', error);
    return null;
  }
}

export async function deleteWorkOrder(id: string): Promise<boolean> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting work order:', error);
    return false;
  }
}

// Legacy localStorage functions (deprecated - use API functions above)
function loadFromStorage(): WorkOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('workOrders');
    if (!stored) return [];
    const parsed = JSON.parse(stored) as WorkOrder[];
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
    return [];
  }
}

function saveToStorage(orders: WorkOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('workOrders', JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving work orders to localStorage:', error);
  }
}

function getDefaultWorkOrders(): WorkOrder[] {
  return [];
}

// Initialize from localStorage or use defaults (deprecated)
const workOrders: WorkOrder[] = loadFromStorage();

export function getAllWorkOrdersLegacy(): WorkOrder[] {
  return workOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getWorkOrderByIdLegacy(id: string): WorkOrder | undefined {
  return workOrders.find(wo => wo.id === id);
}

export function createWorkOrderLegacy(workOrder: WorkOrder): WorkOrder {
  workOrder.id = Date.now().toString();
  workOrder.createdAt = new Date();
  workOrder.updatedAt = new Date();
  workOrders.push(workOrder);
  saveToStorage(workOrders);
  return workOrder;
}

export function updateWorkOrderLegacy(id: string, updates: Partial<WorkOrder>): WorkOrder | null {
  const index = workOrders.findIndex(wo => wo.id === id);
  if (index === -1) return null;
  workOrders[index] = { ...workOrders[index], ...updates, updatedAt: new Date() };
  saveToStorage(workOrders);
  return workOrders[index];
}

export function deleteWorkOrderLegacy(id: string): boolean {
  const index = workOrders.findIndex(wo => wo.id === id);
  if (index === -1) return false;
  workOrders.splice(index, 1);
  saveToStorage(workOrders);
  return true;
}
