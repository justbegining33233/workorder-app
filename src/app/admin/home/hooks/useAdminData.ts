import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  id: string;
  shopId: string;
  plan: string;
  status: string;
  stripeSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  maxUsers: number;
  maxShops: number;
  createdAt: string;
  shop: {
    id: string;
    shopName: string;
    ownerName: string;
    email: string;
    status: string;
    createdAt: string;
    city?: string;
    state?: string;
  };
  techs: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    available?: boolean;
  }>;
  userCount: number;
  metrics?: {
    totalJobs: number;
    completedJobs: number;
    completionRate: number;
    totalRevenue: number;
    revenueThisMonth: number;
    jobsThisMonth: number;
    jobsLastMonth: number;
    avgResponseTime: string;
    activeTechs: number;
    totalTechs: number;
  };
}

interface UserData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
  createdAt: string;
  lastLogin?: string;
  shopId?: string;
  // Role-specific metrics
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  completedJobs?: number;
  totalJobs?: number;
  completionRate?: number;
  totalRevenue?: number;
}

interface UsersLiveMetrics {
  totalUsers: number;
  totalCustomers: number;
  totalTechs: number;
  totalShopOwners: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  newUsersThisWeek: number;
  userGrowth: string;
  activeUsers: number;
  activeRate: string;
  availableTechs: number;
  techAvailabilityRate: string;
  activeCustomers: number;
  customerEngagementRate: string;
  roleDistribution: Record<string, number>;
  userTrend: number[];
  activityHeatmap: number[][];
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRate: string;
  churnRate: string;
  // Adoption metrics
  featureAdoptionRate: number;
  onboardingRate: number;
  powerUserRate: number;
  powerUsers: number;
  onboardedUsers: number;
  dauMauRatio: number;
  // Customer metrics
  avgCustomerValue: number;
  customerSatisfaction: number;
  totalReviewCount: number;
  totalWorkOrders: number;
  completedWorkOrders: number;
  // User health indicators
  accountVerificationRate: number;
  profileCompletionRate: number;
  onboardingCompletionRate: number;
  twoFactorAuthRate: number;
  // Security metrics
  activeSessions: number;
  failedLogins: number;
  accountLockouts: number;
  securityAlerts: number;
}

interface ShopsLiveMetrics {
  totalShops: number;
  newShopsThisMonth: number;
  newShopsLastMonth: number;
  shopGrowth: string;
  totalUsers: number;
  totalCapacity: number;
  utilizationRate: string;
  avgTeamSize: number;
  totalPlatformRevenue: number;
  totalRevenueThisMonth: number;
  mrr: number;
  avgRevenuePerShop: number;
  revenueByPlan: Record<string, number>;
  totalJobs: number;
  completedJobs: number;
  avgCompletionRate: string;
  completedThisMonth: number;
  planDistribution: Record<string, number>;
  weeklyJobTrend: number[];
  serviceDistribution: Array<{ name: string; count: number; percentage: number }>;
  servicesToday: number;
  revenueToday: number;
  avgResponseTime: string;
  avgResponseMinutes: number;
  customerRating: number;
  totalReviews: number;
  jobCompletionRate: number;
  efficiencyRate: number;
  firstTimeFixRate: number;
  pendingActions: {
    shopApplications: number;
    pendingWorkOrders: number;
    customerMessages: number;
    overdueWorkOrders: number;
    expiringSubscriptions: number;
  };
}

interface PlatformStats {
  totalRevenue: string;
  totalShops: number;
  totalJobs: number;
  activeUsers: number;
  pendingShops: number;
  systemHealth: number;
  totalSubscriptions: number;
  newSubsThisMonth: number;
  monthlyRecurringRevenue: string;
}

interface WeeklyOverview {
  weekStart: string;
  weekEnd: string;
  newClientsByDay: number[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  totalNewClientsThisWeek: number;
}

interface ThreeMonthAverages {
  avgNewClientsPerMonth: number;
  avgJobIncomePerMonth: string;
  avgSubscriptionRevenuePerMonth: string;
  churnRate: string;
  churnRateRaw: number;
  totalClientsLast3Months: number;
  totalJobIncomeLast3Months: string;
}

interface LiveMetrics {
  revenueTrend: number[];
  revenueGrowth: string;
  subscriptionTrend: number[];
  retentionRate: string;
  retentionRateRaw: number;
  retentionChange: string;
  avgLifetimeMonths: number;
  avgRating: string;
  reviewsCount: number;
  // New Sales Funnel metrics
  websiteVisits: number;
  trialsCount: number;
  membersCount: number;
  convertedCustomersCount: number;
  // Legacy funnel metrics (kept for compatibility)
  totalShopsEver: number;
  trialSignups: number;
  activeTrials: number;
  convertedCustomers: number;
  conversionRate: string;
  revenueByPlan: Record<string, number>;
  totalMRR: number;
  annualRecurringRevenue: number;
  momGrowth: string;
  yoyGrowth: string;
  ltv: string;
  weeklyConversionTrend: { label: string; value: number }[];
}

export function useAdminData() {
  const { user } = useRequireAuth(['admin']);
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalRevenue: '$0',
    totalShops: 0,
    totalJobs: 0,
    activeUsers: 0,
    pendingShops: 0,
    systemHealth: 100,
    totalSubscriptions: 0,
    newSubsThisMonth: 0,
    monthlyRecurringRevenue: '$0.00'
  });

  const [planDistribution, setPlanDistribution] = useState<Record<string, number>>({});
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverview>({
    weekStart: '',
    weekEnd: '',
    newClientsByDay: [0, 0, 0, 0, 0, 0, 0],
    totalNewClientsThisWeek: 0
  });
  const [threeMonthAverages, setThreeMonthAverages] = useState<ThreeMonthAverages>({
    avgNewClientsPerMonth: 0,
    avgJobIncomePerMonth: '$0.00',
    avgSubscriptionRevenuePerMonth: '$0.00',
    churnRate: '0.0%',
    churnRateRaw: 0,
    totalClientsLast3Months: 0,
    totalJobIncomeLast3Months: '$0.00'
  });
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    revenueTrend: [0, 0, 0, 0, 0, 0, 0],
    revenueGrowth: '0%',
    subscriptionTrend: [0, 0, 0, 0, 0, 0, 0],
    retentionRate: '100%',
    retentionRateRaw: 100,
    retentionChange: '0%',
    avgLifetimeMonths: 0,
    avgRating: '0.0',
    reviewsCount: 0,
    // New Sales Funnel metrics
    websiteVisits: 0,
    trialsCount: 0,
    membersCount: 0,
    convertedCustomersCount: 0,
    // Legacy funnel metrics
    totalShopsEver: 0,
    trialSignups: 0,
    activeTrials: 0,
    convertedCustomers: 0,
    conversionRate: '0%',
    revenueByPlan: {},
    totalMRR: 0,
    annualRecurringRevenue: 0,
    momGrowth: '0%',
    yoyGrowth: '0%',
    ltv: '$0',
    weeklyConversionTrend: []
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [approvedShops, setApprovedShops] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [usersLiveMetrics, setUsersLiveMetrics] = useState<UsersLiveMetrics | null>(null);
  const [shopsLiveMetrics, setShopsLiveMetrics] = useState<ShopsLiveMetrics | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const [
        statsRes,
        pendingRes,
        approvedRes,
        subsRes,
        usersRes
      ] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store', credentials: 'include', headers }),
        fetch('/api/shops/pending', { cache: 'no-store', credentials: 'include', headers }),
        fetch('/api/shops/accepted', { cache: 'no-store', credentials: 'include', headers }),
        fetch('/api/admin/subscriptions', { cache: 'no-store', credentials: 'include', headers }),
        fetch('/api/admin/users', { cache: 'no-store', credentials: 'include', headers })
      ]);

      // Platform stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPlatformStats({
          totalRevenue: statsData.totalRevenue || '$0',
          totalShops: statsData.totalShops || 0,
          totalJobs: statsData.totalJobs || 0,
          activeUsers: statsData.activeUsers || 0,
          pendingShops: statsData.pendingShops || 0,
          systemHealth: 100,
          totalSubscriptions: statsData.totalSubscriptions || 0,
          newSubsThisMonth: statsData.newSubsThisMonth || 0,
          monthlyRecurringRevenue: statsData.monthlyRecurringRevenue || '$0.00'
        });
        if (statsData.recentActivity) {
          setRecentActivity(statsData.recentActivity);
        }
        if (statsData.planDistribution) {
          setPlanDistribution(statsData.planDistribution);
        }
        if (statsData.weeklyOverview) {
          setWeeklyOverview(statsData.weeklyOverview);
        }
        if (statsData.threeMonthAverages) {
          setThreeMonthAverages(statsData.threeMonthAverages);
        }
        if (statsData.liveMetrics) {
          setLiveMetrics(statsData.liveMetrics);
        }
      }

      // Pending shops
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingShops(Array.isArray(pendingData) ? pendingData.slice(0, 3) : []);
      }

      // Approved shops
      if (approvedRes.ok) {
        const approvedData = await approvedRes.json();
        setApprovedShops(Array.isArray(approvedData) ? approvedData.slice(0, 3) : []);
      }

      // Subscriptions with live metrics
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(subsData.subscriptions || []);
        if (subsData.liveMetrics) {
          setShopsLiveMetrics(subsData.liveMetrics);
        }
      }

      // Users with live metrics
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
        if (usersData.liveMetrics) {
          setUsersLiveMetrics(usersData.liveMetrics);
        }
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setDataLoaded(true); // Set to true even on error to prevent infinite loading
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    if (mounted && token) {
      fetchData();
    }
  }, [mounted, token, fetchData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!mounted || !token) return;
    
    const intervalId = setInterval(() => {
      fetchData();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [mounted, token, fetchData]);

  return {
    platformStats,
    subscriptions,
    allUsers,
    pendingShops,
    approvedShops,
    recentActivity,
    planDistribution,
    weeklyOverview,
    threeMonthAverages,
    liveMetrics,
    usersLiveMetrics,
    shopsLiveMetrics,
    dataLoaded
  };
}