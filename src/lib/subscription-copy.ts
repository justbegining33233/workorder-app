import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscription';

export const PLAN_ORDER: SubscriptionPlan[] = ['starter', 'growth', 'professional', 'business', 'enterprise'];

export const PLAN_AUDIENCE: Record<SubscriptionPlan, string> = {
  starter: 'Solo operators and owner-led shops getting digital for the first time.',
  growth: 'Small service teams that need live collaboration without adding operational overhead.',
  professional: 'Established shops that need inventory, payroll, reporting, and multi-shop control.',
  business: 'High-volume operators running multiple shops, teams, and reporting streams.',
  enterprise: 'Groups, fleets, and networks that need unlimited scale, integrations, and platform controls.',
};

export const PLAN_SUMMARY: Record<SubscriptionPlan, string> = {
  starter: 'Core work order operations for one user at one shop.',
  growth: 'Adds messaging, GPS, photos, dashboards, and team workflows for growing shops.',
  professional: 'Adds inventory, payroll, advanced reporting, and up to 3 shops under one owner.',
  business: 'Built for multi-shop operators with revenue analytics, priority support, and higher capacity.',
  enterprise: 'Unlimited users and shops with API access, custom integrations, white-label, and dedicated support.',
};

export const PLAN_MARKETING_HIGHLIGHTS: Record<SubscriptionPlan, string[]> = {
  starter: [
    '1 user / 1 shop',
    'Work orders, time tracking, and file uploads',
    'Basic reporting and email notifications',
    'Simple launch path for owner-operators',
  ],
  growth: [
    '5 users / 1 shop',
    'Messaging, photo capture, GPS verification',
    'Multi-role users and break tracking',
    'Real-time dashboards for a growing team',
  ],
  professional: [
    '15 users / 3 shops',
    'Inventory, payroll, and budget tracking',
    'Advanced reporting and multi-shop management',
    'Best fit for established operators scaling across locations',
  ],
  business: [
    '40 users / 5 shops',
    'Revenue analytics and multi-shop oversight',
    'Priority support for high-volume operations',
    'Designed for operators running several teams at once',
  ],
  enterprise: [
    'Unlimited users / unlimited shops',
    'API access and custom integrations',
    'White-label, SLA guarantees, and dedicated support',
    'Platform-grade controls for fleets and large networks',
  ],
};

export function formatPlanLimit(value: number, noun: string): string {
  if (value === -1) return `Unlimited ${noun}${noun.endsWith('s') ? '' : 's'}`;
  if (value === 1) return `1 ${noun}`;
  return `Up to ${value} ${noun}s`;
}

export function getPlanCapacityLine(plan: SubscriptionPlan): string {
  const details = SUBSCRIPTION_PLANS[plan];
  return `${formatPlanLimit(details.maxUsers, 'user')} • ${formatPlanLimit(details.maxShops, 'shop')}`;
}