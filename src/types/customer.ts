// Customer-specific types for enhanced features
import { Service, PartsMaterials } from './workorder';

// Feature 1: Notifications
export interface Notification {
  id: string;
  type: 'status_change' | 'estimate_ready' | 'tech_arriving' | 'payment_due' | 'work_complete' | 'message_received';
  title: string;
  message: string;
  workOrderId?: string;
  read: boolean;
  createdAt: Date;
  deliveryMethod: ('email' | 'sms' | 'push')[];
}

// Feature 2: Live Tracking
export interface TechLocation {
  techId: string;
  techName: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  eta?: Date;
  lastUpdated: Date;
}

// Feature 5: Payment Methods
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string; // Visa, Mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentTransaction {
  id: string;
  workOrderId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: PaymentMethod;
  receiptUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Feature 6: Appointments
export interface Appointment {
  id: string;
  workOrderId: string;
  requestedDate: Date;
  requestedTimeSlot: 'morning' | 'afternoon' | 'evening' | 'specific';
  specificTime?: string;
  confirmedDate?: Date;
  confirmedBy?: string;
  status: 'requested' | 'confirmed' | 'rescheduled' | 'cancelled';
  notes?: string;
  reminderSent?: boolean;
}

// Feature 7: Reviews & Ratings
export interface Review {
  id: string;
  workOrderId: string;
  customerId: string;
  customerName: string;
  techId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  categories?: {
    quality: number;
    timeliness: number;
    communication: number;
    professionalism: number;
  };
  createdAt: Date;
  response?: {
    text: string;
    respondedBy: string;
    respondedAt: Date;
  };
}

// Feature 8: Favorites & Templates
export interface ServiceFavorite {
  id: string;
  customerId: string;
  name: string;
  vehicleType: string;
  services: Service; // Service type from workorder
  partsMaterials?: PartsMaterials;
  notes?: string;
  createdAt: Date;
  useCount: number;
}

// Feature 9: Loyalty & Rewards
export interface LoyaltyAccount {
  customerId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  ordersCompleted: number;
  referralCode: string;
  referralsCount: number;
  createdAt: Date;
}

export interface Reward {
  id: string;
  type: 'discount' | 'free_service' | 'points_bonus';
  name: string;
  description: string;
  pointsCost?: number;
  discountAmount?: number;
  discountPercent?: number;
  expiresAt?: Date;
  redeemedAt?: Date;
}

// Feature 10: Documents
export interface Document {
  id: string;
  workOrderId?: string;
  customerId: string;
  type: 'warranty' | 'service_manual' | 'contract' | 'receipt' | 'invoice' | 'other';
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  expiresAt?: Date;
  signature?: {
    signedBy: string;
    signedAt: Date;
    signatureUrl: string;
  };
}

// Feature 11: Price Quotes
export interface PriceQuote {
  id: string;
  services: Service;
  vehicleType: string;
  estimatedCost: {
    low: number;
    average: number;
    high: number;
  };
  breakdown: {
    parts: number;
    labor: number;
    other: number;
  };
  tiers?: {
    basic: { price: number; description: string };
    standard: { price: number; description: string };
    premium: { price: number; description: string };
  };
  createdAt: Date;
  expiresAt: Date;
}

// Feature 12: Service History & Insights
export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicleType: string;
  serviceType: string;
  performedAt: Date;
  mileage?: number;
  nextServiceDue?: Date;
  nextServiceMileage?: number;
  workOrderId?: string;
  cost: number;
  notes?: string;
}

export interface ServiceInsight {
  customerId: string;
  totalSpent: number;
  averageOrderValue: number;
  mostFrequentService: string;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
  upcomingMaintenance: {
    vehicleType: string;
    serviceType: string;
    dueDate: Date;
    priority: 'low' | 'medium' | 'high';
  }[];
  recommendations: {
    service: string;
    reason: string;
    estimatedCost: number;
  }[];
}

// Enhanced Customer Profile
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  
  // Feature 1: Notification preferences
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  
  // Feature 5: Payment methods
  paymentMethods: PaymentMethod[];
  
  // Feature 9: Loyalty account
  loyaltyAccount?: LoyaltyAccount;
  
  // Feature 8: Favorites
  favorites: ServiceFavorite[];
  
  // Profile details
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  vehicles?: {
    id: string;
    type: string;
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
  }[];
}
