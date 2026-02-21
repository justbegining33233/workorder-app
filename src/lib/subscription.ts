// Note: avoid importing `prisma` at module top-level because this file is
// imported by client components (e.g. pricing page). Import prisma dynamically
// inside server-only functions to prevent bundling server-only modules into
// client bundles.

// Subscription plan definitions
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    price: 99,
    maxUsers: 1,
    maxShops: 1,
    features: {
      workOrders: true,
      timeTracking: true,
      basicReporting: true,
      emailNotifications: true,
      fileUploads: true,
      // Limited features
      multiRoleUsers: false,
      breakTracking: false,
      gpsVerification: false,
      photoCapture: false,
      messaging: false,
      inventory: false,
      payroll: false,
      budgetTracking: false,
      advancedReporting: false,
      realTimeDashboards: false,
      multiShopManagement: false,
      revenueAnalytics: false,
      customIntegrations: false,
      apiAccess: false,
    }
  },
  growth: {
    name: 'Growth',
    price: 199,
    maxUsers: 5,
    maxShops: 1,
    features: {
      workOrders: true,
      timeTracking: true,
      basicReporting: true,
      emailNotifications: true,
      fileUploads: true,
      // Growth features
      multiRoleUsers: true,
      breakTracking: true,
      gpsVerification: true,
      photoCapture: true,
      messaging: true,
      inventory: false,
      payroll: false,
      budgetTracking: false,
      advancedReporting: false,
      realTimeDashboards: true,
    }
  },
  professional: {
    name: 'Professional',
    price: 349,
    maxUsers: 15,
    maxShops: 1,
    features: {
      workOrders: true,
      timeTracking: true,
      basicReporting: true,
      emailNotifications: true,
      fileUploads: true,
      multiRoleUsers: true,
      breakTracking: true,
      gpsVerification: true,
      photoCapture: true,
      messaging: true,
      // Professional features
      inventory: true,
      payroll: true,
      budgetTracking: true,
      advancedReporting: true,
      realTimeDashboards: true,
    }
  },
  business: {
    name: 'Business',
    price: 599,
    maxUsers: 40,
    maxShops: 5,
    features: {
      workOrders: true,
      timeTracking: true,
      basicReporting: true,
      emailNotifications: true,
      fileUploads: true,
      multiRoleUsers: true,
      breakTracking: true,
      gpsVerification: true,
      photoCapture: true,
      messaging: true,
      inventory: true,
      payroll: true,
      budgetTracking: true,
      advancedReporting: true,
      realTimeDashboards: true,
      // Business features
      multiShopManagement: true,
      revenueAnalytics: true,
      prioritySupport: true,
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    maxUsers: -1, // unlimited
    maxShops: -1, // unlimited
    features: {
      workOrders: true,
      timeTracking: true,
      basicReporting: true,
      emailNotifications: true,
      fileUploads: true,
      multiRoleUsers: true,
      breakTracking: true,
      gpsVerification: true,
      photoCapture: true,
      messaging: true,
      inventory: true,
      payroll: true,
      budgetTracking: true,
      advancedReporting: true,
      realTimeDashboards: true,
      multiShopManagement: true,
      revenueAnalytics: true,
      prioritySupport: true,
      // Enterprise features
      unlimitedShops: true,
      customIntegrations: true,
      slaGuarantees: true,
      whiteLabel: true,
      dedicatedSupport: true,
      apiAccess: true,
    }
  }
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export type SubscriptionFeatures = typeof SUBSCRIPTION_PLANS.starter.features;
function getNextPlanForUsers(currentPlan: SubscriptionPlan, userCount: number): SubscriptionPlan {
  const plans: SubscriptionPlan[] = ['starter', 'growth', 'professional', 'business', 'enterprise'];

  for (const plan of plans) {
    if (SUBSCRIPTION_PLANS[plan].maxUsers >= userCount || SUBSCRIPTION_PLANS[plan].maxUsers === -1) {
      return plan;
    }
  }

  return 'enterprise';
}