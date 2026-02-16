import { prisma } from '@/lib/prisma';

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

/**
 * Get subscription details for a shop
 */
export async function getShopSubscription(shopId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { shopId },
    });

    if (!subscription) {
      // Return default starter plan for shops without subscription
      return {
        ...SUBSCRIPTION_PLANS.starter,
        plan: 'starter' as SubscriptionPlan,
        status: 'active',
        shopId,
      };
    }

    const planDetails = SUBSCRIPTION_PLANS[subscription.plan as SubscriptionPlan];
    if (!planDetails) {
      throw new Error(`Invalid subscription plan: ${subscription.plan}`);
    }

    return {
      ...planDetails,
      plan: subscription.plan as SubscriptionPlan,
      status: subscription.status,
      shopId: subscription.shopId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      maxUsers: subscription.maxUsers,
      maxShops: subscription.maxShops,
    };
  } catch (error) {
    console.error('Error getting shop subscription:', error);
    // Return starter plan as fallback
    return {
      ...SUBSCRIPTION_PLANS.starter,
      plan: 'starter' as SubscriptionPlan,
      status: 'active',
      shopId,
    };
  }
}

/**
 * Check if a shop has access to a specific feature
 */
export async function hasFeatureAccess(shopId: string, feature: string): Promise<boolean> {
  const subscription = await getShopSubscription(shopId);
  return (subscription.features as any)[feature] || false;
}

/**
 * Check if a shop can add more users
 */
export async function canAddUsers(shopId: string, currentUserCount: number): Promise<boolean> {
  const subscription = await getShopSubscription(shopId);
  if (subscription.maxUsers === -1) return true; // unlimited
  return currentUserCount < subscription.maxUsers;
}

/**
 * Check if a shop can add more shops (for multi-shop plans)
 */
export async function canAddShops(shopId: string, currentShopCount: number): Promise<boolean> {
  const subscription = await getShopSubscription(shopId);
  if (subscription.maxShops === -1) return true; // unlimited
  return currentShopCount < subscription.maxShops;
}

/**
 * Get user count for a shop
 */
export async function getShopUserCount(shopId: string): Promise<number> {
  const techCount = await prisma.tech.count({
    where: { shopId },
  });

  // Add 1 for the shop owner/admin
  return techCount + 1;
}

/**
 * Get shop count for an organization (for enterprise plans)
 */
export async function getOrganizationShopCount(organizationId: string): Promise<number> {
  // This would need to be implemented based on your organization structure
  // For now, return 1
  return 1;
}

/**
 * Check subscription status
 */
export async function isSubscriptionActive(shopId: string): Promise<boolean> {
  const subscription = await getShopSubscription(shopId);
  return subscription.status === 'active';
}

/**
 * Get upgrade suggestions based on current usage
 */
export async function getUpgradeSuggestions(shopId: string) {
  const subscription = await getShopSubscription(shopId);
  const userCount = await getShopUserCount(shopId);

  const suggestions = [];

  if (userCount >= subscription.maxUsers && subscription.maxUsers !== -1) {
    suggestions.push({
      reason: `You have ${userCount} users, but your plan only allows ${subscription.maxUsers}`,
      recommendedPlan: getNextPlanForUsers(subscription.plan, userCount),
    });
  }

  // Add more upgrade suggestions based on feature usage
  // This could be expanded to track feature usage patterns

  return suggestions;
}

function getNextPlanForUsers(currentPlan: SubscriptionPlan, userCount: number): SubscriptionPlan {
  const plans: SubscriptionPlan[] = ['starter', 'growth', 'professional', 'business', 'enterprise'];

  for (const plan of plans) {
    if (SUBSCRIPTION_PLANS[plan].maxUsers >= userCount || SUBSCRIPTION_PLANS[plan].maxUsers === -1) {
      return plan;
    }
  }

  return 'enterprise';
}