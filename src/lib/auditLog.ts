import { AuditLog } from '../types/roles';

const logs: AuditLog[] = [];

export function logAdminAction(userId: string, action: string, details?: string) {
  logs.push({
    id: Date.now().toString(36),
    userId,
    action,
    timestamp: new Date().toISOString(),
    details,
  });
}

export function getAuditLogs(): AuditLog[] {
  return logs;
}
