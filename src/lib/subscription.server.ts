import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from './subscription';
import { prisma } from './prisma';

const ALLOWED_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

function isSubscriptionStatusAllowed(status: string | null | undefined): boolean {
  if (!status) return false;
  return ALLOWED_SUBSCRIPTION_STATUSES.has(status);
}

export async function getRawShopSubscription(shopId: string) {
  return prisma.subscription.findUnique({ where: { shopId } });
}

export async function getShopSubscriptionGateStatus(shopId: string) {
  const subscription = await getRawShopSubscription(shopId);

  if (!subscription) {
    return {
      allowed: false,
      reason: 'no_subscription',
      status: null,
      plan: null,
    } as const;
  }

  const allowed = isSubscriptionStatusAllowed(subscription.status);
  return {
    allowed,
    reason: allowed ? 'ok' : 'inactive_subscription',
    status: subscription.status,
    plan: subscription.plan,
  } as const;
}

export async function getShopSubscription(shopId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { shopId } });

    if (!subscription) {
      return {
        ...SUBSCRIPTION_PLANS.starter,
        plan: 'starter' as SubscriptionPlan,
        status: 'active',
        shopId,
      };
    }

    const planDetails = SUBSCRIPTION_PLANS[subscription.plan as SubscriptionPlan];
    if (!planDetails) throw new Error(`Invalid subscription plan: ${subscription.plan}`);

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
    return {
      ...SUBSCRIPTION_PLANS.starter,
      plan: 'starter' as SubscriptionPlan,
      status: 'active',
      shopId,
    };
  }
}

export async function getShopUserCount(shopId: string): Promise<number> {
  const techCount = await prisma.tech.count({ where: { shopId } });
  return techCount + 1;
}

export async function hasFeatureAccess(shopId: string, feature: string): Promise<boolean> {
  const subscription = await getShopSubscription(shopId);
  return (subscription.features as any)[feature] || false;
}

export async function canAddUsers(shopId: string, currentUserCount: number): Promise<boolean> {
  const subscription = await getShopSubscription(shopId);
  if (subscription.maxUsers === -1) return true;
  return currentUserCount < subscription.maxUsers;
}

export async function isSubscriptionActive(shopId: string): Promise<boolean> {
  const subscription = await getRawShopSubscription(shopId);
  if (!subscription) return false;
  return isSubscriptionStatusAllowed(subscription.status);
}

export async function getUpgradeSuggestions(shopId: string) {
  const subscription = await getShopSubscription(shopId);
  const userCount = await getShopUserCount(shopId);
  const suggestions: any[] = [];
  if (userCount >= subscription.maxUsers && subscription.maxUsers !== -1) {
    suggestions.push({
      reason: `You have ${userCount} users, but your plan only allows ${subscription.maxUsers}`,
      recommendedPlan: getNextPlanForUsers(subscription.plan, userCount),
    });
  }
  return suggestions;
}

function getNextPlanForUsers(currentPlan: SubscriptionPlan, userCount: number): SubscriptionPlan {
  const plans: SubscriptionPlan[] = ['starter', 'growth', 'professional', 'business', 'enterprise'];
  for (const plan of plans) {
    if (SUBSCRIPTION_PLANS[plan].maxUsers >= userCount || SUBSCRIPTION_PLANS[plan].maxUsers === -1) return plan;
  }
  return 'enterprise';
}
