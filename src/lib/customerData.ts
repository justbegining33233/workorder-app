// Mock data stores for customer features

import { 
  TechLocation, PaymentMethod, PaymentTransaction, Appointment, 
  Review, ServiceFavorite, LoyaltyAccount, Reward, Document, 
  PriceQuote, MaintenanceLog, ServiceInsight
} from '@/types/customer';
import { Service } from '@/types/workorder';

// Tech Location Tracking
const techLocations: Map<string, TechLocation> = new Map();

export function updateTechLocation(location: TechLocation) {
  techLocations.set(location.techId, location);
}

export function getTechLocation(techId: string): TechLocation | undefined {
  return techLocations.get(techId);
}

// Payment Methods
const paymentMethods: Map<string, PaymentMethod[]> = new Map();

export function getPaymentMethods(customerId: string): PaymentMethod[] {
  return paymentMethods.get(customerId) || [];
}

export function addPaymentMethod(customerId: string, method: Omit<PaymentMethod, 'id' | 'createdAt'>): PaymentMethod {
  const newMethod: PaymentMethod = {
    ...method,
    id: `pm-${Date.now()}`,
    createdAt: new Date(),
  };
  const methods = paymentMethods.get(customerId) || [];
  paymentMethods.set(customerId, [...methods, newMethod]);
  return newMethod;
}

export function deletePaymentMethod(customerId: string, methodId: string): boolean {
  const methods = paymentMethods.get(customerId) || [];
  const filtered = methods.filter(m => m.id !== methodId);
  paymentMethods.set(customerId, filtered);
  return true;
}

// Payment Transactions
const transactions: PaymentTransaction[] = [];

export function getAllTransactions(customerId?: string): PaymentTransaction[] {
  if (!customerId) return transactions;
  // In a real app, filter by customerId from work orders
  return transactions;
}

export function createTransaction(transaction: Omit<PaymentTransaction, 'id' | 'createdAt'>): PaymentTransaction {
  const newTransaction: PaymentTransaction = {
    ...transaction,
    id: `txn-${Date.now()}`,
    createdAt: new Date(),
  };
  transactions.push(newTransaction);
  return newTransaction;
}

// Appointments
const appointments: Map<string, Appointment> = new Map();

export function getAppointment(workOrderId: string): Appointment | undefined {
  return appointments.get(workOrderId);
}

export function createAppointment(appointment: Omit<Appointment, 'id'>): Appointment {
  const newAppointment: Appointment = {
    ...appointment,
    id: `appt-${Date.now()}`,
  };
  appointments.set(appointment.workOrderId, newAppointment);
  return newAppointment;
}

export function updateAppointment(workOrderId: string, updates: Partial<Appointment>): Appointment | undefined {
  const existing = appointments.get(workOrderId);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  appointments.set(workOrderId, updated);
  return updated;
}

// Reviews
const reviews: Review[] = [];

export function getReviews(workOrderId?: string): Review[] {
  if (!workOrderId) return reviews;
  return reviews.filter(r => r.workOrderId === workOrderId);
}

export function createReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
  const newReview: Review = {
    ...review,
    id: `rev-${Date.now()}`,
    createdAt: new Date(),
  };
  reviews.push(newReview);
  return newReview;
}

// Service Favorites
const favorites: Map<string, ServiceFavorite[]> = new Map();

export function getFavorites(customerId: string): ServiceFavorite[] {
  return favorites.get(customerId) || [];
}

export function addFavorite(customerId: string, favorite: Omit<ServiceFavorite, 'id' | 'createdAt' | 'useCount'>): ServiceFavorite {
  const newFavorite: ServiceFavorite = {
    ...favorite,
    id: `fav-${Date.now()}`,
    createdAt: new Date(),
    useCount: 0,
  };
  const userFavs = favorites.get(customerId) || [];
  favorites.set(customerId, [...userFavs, newFavorite]);
  return newFavorite;
}

export function deleteFavorite(customerId: string, favoriteId: string): boolean {
  const userFavs = favorites.get(customerId) || [];
  const filtered = userFavs.filter(f => f.id !== favoriteId);
  favorites.set(customerId, filtered);
  return true;
}

// Loyalty Accounts
const loyaltyAccounts: Map<string, LoyaltyAccount> = new Map();

export function getLoyaltyAccount(customerId: string): LoyaltyAccount {
  if (!loyaltyAccounts.has(customerId)) {
    const newAccount: LoyaltyAccount = {
      customerId,
      points: 0,
      tier: 'bronze',
      totalSpent: 0,
      ordersCompleted: 0,
      referralCode: `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      referralsCount: 0,
      createdAt: new Date(),
    };
    loyaltyAccounts.set(customerId, newAccount);
  }
  return loyaltyAccounts.get(customerId)!;
}

export function updateLoyaltyAccount(customerId: string, updates: Partial<LoyaltyAccount>): LoyaltyAccount {
  const account = getLoyaltyAccount(customerId);
  const updated = { ...account, ...updates };
  loyaltyAccounts.set(customerId, updated);
  return updated;
}

// Rewards
const rewards: Map<string, Reward[]> = new Map();

export function getRewards(customerId: string): Reward[] {
  return rewards.get(customerId) || [
    {
      id: 'rew-1',
      type: 'discount',
      name: '10% Off Next Service',
      description: 'Get 10% off your next work order',
      pointsCost: 100,
      discountPercent: 10,
    },
    {
      id: 'rew-2',
      type: 'discount',
      name: '$25 Off',
      description: 'Save $25 on any service',
      pointsCost: 250,
      discountAmount: 25,
    },
    {
      id: 'rew-3',
      type: 'free_service',
      name: 'Free Oil Change',
      description: 'Complimentary oil change service',
      pointsCost: 500,
    },
  ];
}

// Documents
const documents: Map<string, Document[]> = new Map();

export function getDocuments(customerId: string, workOrderId?: string): Document[] {
  const userDocs = documents.get(customerId) || [];
  if (workOrderId) {
    return userDocs.filter(d => d.workOrderId === workOrderId);
  }
  return userDocs;
}

export function addDocument(customerId: string, document: Omit<Document, 'id' | 'uploadedAt'>): Document {
  const newDoc: Document = {
    ...document,
    id: `doc-${Date.now()}`,
    uploadedAt: new Date(),
  };
  const userDocs = documents.get(customerId) || [];
  documents.set(customerId, [...userDocs, newDoc]);
  return newDoc;
}

// Price Quotes
export function generatePriceQuote(services: Service, vehicleType: string): PriceQuote {
  const basePrice = 150;
  const variance = 50;
  
  return {
    id: `quote-${Date.now()}`,
    services,
    vehicleType,
    estimatedCost: {
      low: basePrice - variance,
      average: basePrice,
      high: basePrice + variance,
    },
    breakdown: {
      parts: basePrice * 0.6,
      labor: basePrice * 0.35,
      other: basePrice * 0.05,
    },
    tiers: {
      basic: { price: basePrice - 30, description: 'Standard parts, basic service' },
      standard: { price: basePrice, description: 'Quality parts, thorough service' },
      premium: { price: basePrice + 50, description: 'Premium parts, extended warranty' },
    },
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

// Maintenance Logs
const maintenanceLogs: Map<string, MaintenanceLog[]> = new Map();

export function getMaintenanceLogs(customerId: string): MaintenanceLog[] {
  return maintenanceLogs.get(customerId) || [];
}

export function addMaintenanceLog(customerId: string, log: Omit<MaintenanceLog, 'id'>): MaintenanceLog {
  const newLog: MaintenanceLog = {
    ...log,
    id: `log-${Date.now()}`,
  };
  const logs = maintenanceLogs.get(customerId) || [];
  maintenanceLogs.set(customerId, [...logs, newLog]);
  return newLog;
}

// Service Insights
export function getServiceInsights(customerId: string): ServiceInsight {
  const logs = getMaintenanceLogs(customerId);
  const totalSpent = logs.reduce((sum, log) => sum + log.cost, 0);
  const avgOrderValue = logs.length > 0 ? totalSpent / logs.length : 0;
  
  return {
    customerId,
    totalSpent,
    averageOrderValue: avgOrderValue,
    mostFrequentService: 'Oil Change',
    spendingTrend: 'stable',
    upcomingMaintenance: [
      {
        vehicleType: 'semi-truck',
        serviceType: 'Oil Change',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'medium',
      },
    ],
    recommendations: [
      {
        service: 'Tire Rotation',
        reason: 'Due based on mileage',
        estimatedCost: 89,
      },
    ],
  };
}
