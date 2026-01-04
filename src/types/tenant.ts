export interface Tenant {
  id: string;
  companyName: string;
  subdomain: string; // e.g., "joes-auto" for joes-auto.yourapp.com
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  subscription: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    startDate: Date;
    renewalDate: Date;
    maxUsers: number;
    maxWorkOrders: number;
  };
  settings: {
    timezone: string;
    currency: string;
    businessHours: {
      start: string; // e.g., "08:00"
      end: string; // e.g., "17:00"
    };
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'tech' | 'customer';
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}
