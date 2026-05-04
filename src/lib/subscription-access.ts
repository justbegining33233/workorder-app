import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscription';

type FeatureKey =
  | 'messaging'
  | 'inventory'
  | 'multiRoleUsers'
  | 'payroll'
  | 'advancedReporting'
  | 'multiShopManagement'
  | 'revenueAnalytics'
  | 'customIntegrations'
  | 'apiAccess'
  | 'photoCapture';

const ROUTE_FEATURE_RULES: Array<{ prefix: string; feature: FeatureKey }> = [
  // Messaging
  { prefix: '/shop/customer-messages', feature: 'messaging' },
  { prefix: '/manager/messages', feature: 'messaging' },
  { prefix: '/tech/messages', feature: 'messaging' },

  // Inventory and parts ops
  { prefix: '/shop/inventory/shared', feature: 'inventory' },
  { prefix: '/shop/inventory', feature: 'inventory' },
  { prefix: '/shop/vendors', feature: 'inventory' },
  { prefix: '/shop/purchase-orders', feature: 'inventory' },
  { prefix: '/shop/core-returns', feature: 'inventory' },
  { prefix: '/manager/inventory', feature: 'inventory' },
  { prefix: '/tech/inventory', feature: 'inventory' },
  { prefix: '/shop/parts-labor', feature: 'inventory' },

  // Team role controls
  { prefix: '/shop/manage-team', feature: 'multiRoleUsers' },
  { prefix: '/shop/settings/permissions', feature: 'multiRoleUsers' },
  { prefix: '/manager/team', feature: 'multiRoleUsers' },
  { prefix: '/shop/admin/team', feature: 'multiRoleUsers' },
  { prefix: '/shop/settings/schedule', feature: 'multiRoleUsers' },
  { prefix: '/manager/settings/permissions', feature: 'multiRoleUsers' },

  // Payroll and budgeting
  { prefix: '/shop/payroll', feature: 'payroll' },
  { prefix: '/manager/payroll', feature: 'payroll' },
  { prefix: '/shop/admin/payroll', feature: 'payroll' },

  // Advanced analytics/reporting surfaces
  { prefix: '/shop/analytics', feature: 'advancedReporting' },
  { prefix: '/shop/ar-aging', feature: 'advancedReporting' },
  { prefix: '/shop/profit-margins', feature: 'advancedReporting' },
  { prefix: '/manager/reports', feature: 'advancedReporting' },
  { prefix: '/shop/eod-report', feature: 'advancedReporting' },
  { prefix: '/shop/payment-links', feature: 'advancedReporting' },
  { prefix: '/shop/referrals', feature: 'advancedReporting' },
  { prefix: '/shop/campaigns', feature: 'advancedReporting' },
  { prefix: '/shop/branding', feature: 'advancedReporting' },
  { prefix: '/shop/automations', feature: 'advancedReporting' },
  { prefix: '/shop/admin/settings', feature: 'advancedReporting' },
  { prefix: '/shop/admin/logs', feature: 'advancedReporting' },
  { prefix: '/shop/admin/health', feature: 'advancedReporting' },
  { prefix: '/shop/tax-settings', feature: 'advancedReporting' },
  { prefix: '/shop/reviews', feature: 'advancedReporting' },
  { prefix: '/manager/admin/settings', feature: 'advancedReporting' },
  { prefix: '/manager/admin/logs', feature: 'advancedReporting' },

  // Multi-location and revenue intelligence
  { prefix: '/shop/locations', feature: 'multiShopManagement' },
  { prefix: '/shop/customer-reports', feature: 'revenueAnalytics' },
  { prefix: '/shop/fleet', feature: 'multiShopManagement' },

  // API and integrations
  { prefix: '/shop/integrations', feature: 'customIntegrations' },
  { prefix: '/shop/settings/api-keys', feature: 'apiAccess' },
  { prefix: '/shop/settings/webhooks', feature: 'apiAccess' },

  // Photo-centric workflows
  { prefix: '/shop/dvi', feature: 'photoCapture' },
  { prefix: '/shop/condition-reports', feature: 'photoCapture' },
  { prefix: '/tech/photos', feature: 'photoCapture' },
  { prefix: '/shop/inspections', feature: 'photoCapture' },
  { prefix: '/tech/dvi', feature: 'photoCapture' },

  // Realtime workflow surfaces (Growth+)
  { prefix: '/shop/recurring-workorders', feature: 'messaging' },
  { prefix: '/manager/recurring-workorders', feature: 'messaging' },
  { prefix: '/shop/waiting-room', feature: 'messaging' },
];

const SORTED_RULES = [...ROUTE_FEATURE_RULES].sort((a, b) => b.prefix.length - a.prefix.length);

function resolvePlan(plan: SubscriptionPlan | string | null | undefined): SubscriptionPlan {
  if (plan && plan in SUBSCRIPTION_PLANS) {
    return plan as SubscriptionPlan;
  }
  return 'starter';
}

export function getPlanFeatures(plan: SubscriptionPlan | string | null | undefined) {
  const normalizedPlan = resolvePlan(plan);
  const features = SUBSCRIPTION_PLANS[normalizedPlan].features as Record<string, unknown>;
  const has = (key: string) => Boolean(features[key]);

  return {
    multiRoleUsers: has('multiRoleUsers'),
    photoCapture: has('photoCapture'),
    messaging: has('messaging'),
    inventory: has('inventory'),
    payroll: has('payroll'),
    advancedReporting: has('advancedReporting'),
    multiShopManagement: has('multiShopManagement'),
    revenueAnalytics: has('revenueAnalytics'),
    customIntegrations: has('customIntegrations'),
    apiAccess: has('apiAccess'),
  } as Record<FeatureKey, boolean>;
}

export function getRequiredFeatureForPath(pathname: string): FeatureKey | null {
  const rule = SORTED_RULES.find((r) => pathname.startsWith(r.prefix));
  return rule ? rule.feature : null;
}

export function isPathAllowedForPlan(pathname: string, plan: SubscriptionPlan | string | null | undefined): boolean {
  const requiredFeature = getRequiredFeatureForPath(pathname);
  if (!requiredFeature) return true;
  return Boolean(getPlanFeatures(plan)[requiredFeature]);
}
