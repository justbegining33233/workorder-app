// Platform-wide settings stored in memory (persists until server restart)
// In production, these should be stored in DB in a PlatformSettings table
export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  timezone: string;
  maintenanceMode: boolean;
  enableShopRegistration: boolean;
  enableCustomerPortal: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  maxShopsPerPlan: Record<string, number>;
  serviceFee: number; // flat fee per work order in cents
  trialDays: number;
  defaultSubscriptionPlan: string;
}

const defaults: PlatformSettings = {
  platformName: 'FixTray',
  supportEmail: 'support@fixtray.app',
  timezone: 'America/New_York',
  maintenanceMode: false,
  enableShopRegistration: true,
  enableCustomerPortal: true,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  maxShopsPerPlan: { starter: 1, growth: 1, professional: 3, business: 5, enterprise: 999 },
  serviceFee: 500,
  trialDays: 7,
  defaultSubscriptionPlan: 'starter',
};

let current: PlatformSettings = { ...defaults };

export function getSettings(): PlatformSettings {
  return { ...current };
}

export function updateSettings(patch: Partial<PlatformSettings>): PlatformSettings {
  current = { ...current, ...patch };
  return { ...current };
}

export function resetSettings(): PlatformSettings {
  current = { ...defaults };
  return { ...current };
}
