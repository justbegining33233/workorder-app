import prisma from '@/lib/prisma';

// Default permissions per role
const ROLE_DEFAULTS: Record<string, Record<string, boolean>> = {
  manager: {
    'workorders.create': true, 'workorders.edit': true, 'workorders.delete': true, 'workorders.view': true,
    'inventory.view': true, 'inventory.edit': true,
    'techs.view': true, 'techs.manage': true,
    'payroll.view': true, 'payroll.manage': true,
    'reports.view': true,
    'settings.view': true, 'settings.manage': true,
    'estimates.create': true, 'estimates.approve': true,
    'timeclock.view': true, 'timeclock.manage': true,
  },
  tech: {
    'workorders.view': true, 'workorders.edit': true, 'workorders.create': false,
    'inventory.view': true, 'inventory.edit': false,
    'techs.view': false, 'techs.manage': false,
    'payroll.view': false, 'payroll.manage': false,
    'reports.view': false,
    'settings.view': false, 'settings.manage': false,
    'estimates.create': true, 'estimates.approve': false,
    'timeclock.view': true, 'timeclock.manage': false,
  },
};

/**
 * All available permissions
 */
export const ALL_PERMISSIONS = [
  'workorders.create', 'workorders.edit', 'workorders.delete', 'workorders.view',
  'inventory.view', 'inventory.edit',
  'techs.view', 'techs.manage',
  'payroll.view', 'payroll.manage',
  'reports.view',
  'settings.view', 'settings.manage',
  'estimates.create', 'estimates.approve',
  'timeclock.view', 'timeclock.manage',
];

/**
 * Check if a tech/manager has a specific permission.
 * Checks individual overrides first, then role defaults.
 */
export async function checkPermission(shopId: string, techId: string, role: string, permission: string): Promise<boolean> {
  try {
    // Check individual override first
    const override = await prisma.permission.findUnique({
      where: { shopId_techId_permission: { shopId, techId, permission } },
    });
    if (override) return override.allowed;

    // Check role-level override
    const roleOverride = await prisma.permission.findFirst({
      where: { shopId, role, techId: null, permission },
    });
    if (roleOverride) return roleOverride.allowed;

    // Fall back to default
    return ROLE_DEFAULTS[role]?.[permission] ?? false;
  } catch {
    // If permission system fails, fall back to role defaults
    return ROLE_DEFAULTS[role]?.[permission] ?? false;
  }
}

/**
 * Get all permissions for a specific tech.
 */
export async function getPermissionsForTech(shopId: string, techId: string, role: string): Promise<Record<string, boolean>> {
  const defaults = ROLE_DEFAULTS[role] || {};
  const result: Record<string, boolean> = {};

  // Start with defaults
  for (const perm of ALL_PERMISSIONS) {
    result[perm] = defaults[perm] ?? false;
  }

  try {
    // Apply role overrides
    const roleOverrides = await prisma.permission.findMany({
      where: { shopId, role, techId: null },
    });
    for (const ro of roleOverrides) {
      result[ro.permission] = ro.allowed;
    }

    // Apply individual overrides
    const personalOverrides = await prisma.permission.findMany({
      where: { shopId, techId },
    });
    for (const po of personalOverrides) {
      result[po.permission] = po.allowed;
    }
  } catch {
    // Return defaults on error
  }

  return result;
}
