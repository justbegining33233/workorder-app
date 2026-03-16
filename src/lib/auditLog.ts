import prisma from '@/lib/prisma';

export async function logAdminAction(adminId: string, action: string, details?: string, extra?: { targetId?: string; targetType?: string; ipAddress?: string; userAgent?: string; shopId?: string }) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        details,
        targetId: extra?.targetId,
        targetType: extra?.targetType,
        ipAddress: extra?.ipAddress,
        userAgent: extra?.userAgent,
        shopId: extra?.shopId,
      },
    });
  } catch (err) {
    console.error('[auditLog] Failed to write audit log:', err);
  }
}

export async function getAuditLogs(limit = 200, shopId?: string) {
  const where = shopId ? { shopId } : {};
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
