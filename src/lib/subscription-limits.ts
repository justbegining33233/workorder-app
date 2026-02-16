import { NextRequest, NextResponse } from 'next/server';
import { getShopSubscription, canAddUsers, getShopUserCount, isSubscriptionActive } from '@/lib/subscription';
import { verifyToken } from '@/lib/auth';

/**
 * Middleware to enforce subscription limits
 */
export async function enforceSubscriptionLimits(request: NextRequest, shopId: string) {
  try {
    // Check if subscription is active
    const isActive = await isSubscriptionActive(shopId);
    if (!isActive) {
      return NextResponse.json(
        { error: 'Subscription is not active. Please update your payment method or renew your subscription.' },
        { status: 403 }
      );
    }

    // Get current user count for user-related actions
    const userCount = await getShopUserCount(shopId);

    // Check limits based on the request path
    const pathname = request.nextUrl.pathname;

    // User creation/management endpoints
    if (pathname.includes('/users') || pathname.includes('/techs')) {
      const canAdd = await canAddUsers(shopId, userCount);
      if (!canAdd) {
        const subscription = await getShopSubscription(shopId);
        return NextResponse.json(
          {
            error: `User limit reached. Your ${subscription.name} plan allows ${subscription.maxUsers} users. Please upgrade to add more users.`,
            upgradeRequired: true,
            currentPlan: subscription.plan,
            maxUsers: subscription.maxUsers,
            currentUsers: userCount
          },
          { status: 403 }
        );
      }
    }

    // Feature-specific checks can be added here based on the endpoint
    // For example, inventory endpoints, messaging, etc.

    return null; // No limit violations
  } catch (error) {
    console.error('Error enforcing subscription limits:', error);
    // Allow the request to proceed if there's an error checking limits
    // This prevents blocking legitimate requests due to system errors
    return null;
  }
}

/**
 * Check feature access for a specific shop
 */
export async function checkFeatureAccess(shopId: string, feature: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const subscription = await getShopSubscription(shopId);

    const featureMap: Record<string, string> = {
      'inventory': 'inventory',
      'payroll': 'payroll',
      'budgetTracking': 'budgetTracking',
      'advancedReporting': 'advancedReporting',
      'messaging': 'messaging',
      'multiRoleUsers': 'multiRoleUsers',
      'breakTracking': 'breakTracking',
      'gpsVerification': 'gpsVerification',
      'photoCapture': 'photoCapture',
      'realTimeDashboards': 'realTimeDashboards',
      'multiShopManagement': 'multiShopManagement',
      'revenueAnalytics': 'revenueAnalytics',
      'customIntegrations': 'customIntegrations',
      'apiAccess': 'apiAccess',
    };

    const featureKey = featureMap[feature];
    if (!featureKey) {
      return { allowed: true }; // Unknown feature, allow access
    }

    const allowed = (subscription.features as any)[featureKey] || false;

    if (!allowed) {
      return {
        allowed: false,
        message: `${feature} is not available on your ${subscription.name} plan. Please upgrade to access this feature.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return { allowed: true }; // Allow access if there's an error
  }
}

/**
 * API route wrapper to enforce subscription limits
 */
export function withSubscriptionLimits(handler: Function) {
  return async (request: NextRequest, context: any) => {
    try {
      // Extract shopId from request (this might need to be adjusted based on your API structure)
      const { searchParams } = new URL(request.url);
      const shopId = searchParams.get('shopId') || context.params?.shopId;

      if (!shopId) {
        // If no shopId, try to get it from the authenticated user
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded = verifyToken(token);
          if (decoded && decoded.shopId) {
            const limitCheck = await enforceSubscriptionLimits(request, decoded.shopId);
            if (limitCheck) return limitCheck;
          }
        }
      } else {
        const limitCheck = await enforceSubscriptionLimits(request, shopId);
        if (limitCheck) return limitCheck;
      }

      // Proceed with the original handler
      return handler(request, context);
    } catch (error) {
      console.error('Subscription limit middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export function withFeatureGate(feature: string) {
  // Placeholder for future implementation
  return (Component: any) => Component;
}