export type UserRole = 'admin' | 'manager' | 'tech' | 'customer';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
}
