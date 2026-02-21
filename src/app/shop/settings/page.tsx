'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

type CategoryId = 'diesel' | 'gas' | 'small-engine' | 'heavy-equipment' | 'resurfacing' | 'welding' | 'tire';

// Service type options
const DIESEL_SERVICES = [
  'Engine Diagnostics',
  'Engine Repair',
  'Engine Rebuild',
  'Transmission Repair',
  'Brake System',
  'Air Brake Service',
  'Electrical Diagnostics',
  'Electrical Repair',
  'Tire Service',
  'Tire Replacement',
  'Wheel Alignment',
  'Suspension Repair',
  'Hydraulic Systems',
  'Air Conditioning',
  'Exhaust Repair',
  'DEF System',
  'DPF Cleaning',
  'Oil Change',
  'Preventive Maintenance',
  'DOT Inspections',
  'Trailer Repair',
  'Reefer Repair',
  'Welding',
  'Roadside Assistance'
];

const GAS_SERVICES = [
  'Engine Diagnostics',
  'Engine Repair',
  'Transmission Service',
  'Transmission Repair',
  'Brake Service',
  'Brake Replacement',
  'Oil Change',
  'Tune-up',
  'Electrical Diagnostics',
  'Electrical Repair',
  'Battery Service',
  'Tire Rotation',
  'Tire Replacement',
  'Wheel Alignment',
  'Suspension Repair',
  'Air Conditioning',
  'Heating Repair',
  'Exhaust Repair',
  'Catalytic Converter',
  'Emissions Testing',
  'State Inspection',
  'Windshield Replacement',
  'Fluid Service',
  'Coolant Flush',
  'Fuel System Cleaning',
  'Timing Belt',
  'Roadside Assistance'
];

const SMALL_ENGINE_SERVICES = [
  'Engine Diagnostics',
  'Carburetor Cleaning & Rebuild',
  'Fuel System Repair',
  'Ignition System Repair',
  'Spark Plug Replacement',
  'Oil Change & Filter Service',
  'Air Filter Cleaning/Replacement',
  'Tune-Up',
  'Blade Sharpening',
  'Belt Replacement',
  'Starter Repair',
  'Recoil Starter Repair',
  'Compression Testing',
  'Two-Stroke / Four-Stroke Service',
  'Chain Sharpening (Chainsaws)',
  'String Trimmer Repair',
  'Blower Repair',
  'Generator Service',
  'Pressure Washer Repair',
  'Preventive Maintenance',
  'Parts Replacement',
  'Winterization / Storage Prep'
];

const HEAVY_EQUIPMENT_SERVICES = [
  'Hydraulic System Diagnostics & Repair',
  'Hydraulic Cylinder Rebuild',
  'Undercarriage Inspection & Repair',
  'Track / Chain Replacement',
  'Sprocket & Roller Replacement',
  'Final Drive Repair',
  'Engine Diagnostics & Repair',
  'Transmission Service & Repair',
  'Boom & Arm Repair',
  'Bucket / Blade Repair',
  'Pin & Bushing Replacement',
  'Electrical System Repair',
  'Brake System Service',
  'Cooling System Flush & Repair',
  'Preventive Maintenance',
  'Field Service / On-Site Repair',
  'Welding & Fabrication Repair',
  'Pump Repair',
  'Valve Adjustment',
  'Heavy Equipment Inspections'
];

const RESURFACING_SERVICES = [
  'Cylinder Head Resurfacing',
  'Engine Block Resurfacing',
  'Flywheel Resurfacing',
  'Brake Rotor Resurfacing',
  'Surface Grinding',
  'Milling & Machining',
  'Line Boring',
  'Valve Seat Cutting',
  'Crankshaft Grinding',
  'Align Boring',
  'Sleeving / Boring Engine Cylinders',
  'Precision Measurement & Inspection',
  'Custom Machining',
  'Head Gasket Surface Prep',
  'Deck Surfacing'
];

const WELDING_SERVICES = [
  'MIG Welding',
  'TIG Welding',
  'Stick Welding',
  'Aluminum Welding',
  'Stainless Steel Welding',
  'Cast Iron Repair Welding',
  'Structural Welding',
  'Custom Fabrication',
  'Weld Repairs',
  'Hardfacing / Wear Resistant Overlay',
  'Mobile / On-Site Welding',
  'Pipe Welding',
  'Trailer & Frame Repair',
  'Heavy Equipment Weld Repair',
  'Metal Cutting & Preparation',
  'Weld Inspection & Testing'
];

const TIRE_SHOP_SERVICES = [
  'Tire Replacement',
  'Tire Installation',
  'Flat Tire Repair',
  'Tire Patching',
  'Tire Rotation',
  'Wheel Balancing',
  'Wheel Alignment',
  'Tire Pressure Monitoring System (TPMS) Service',
  'TPMS Sensor Replacement',
  'Tire Inspection',
  'Tread Depth Check',
  'Tire Mounting',
  'Tire Demounting',
  'Valve Stem Replacement',
  'Tire Plug Repair',
  'Run-Flat Tire Service',
  'Seasonal Tire Changeover (Winter/Summer)',
  'Tire Storage',
  'Used Tire Sales',
  'Tire Disposal / Recycling',
  'Road Hazard Warranty',
  'Tire Roadside Assistance',
  'Custom Wheel Installation',
  'Rim Repair',
  'Preventive Tire Maintenance'
];

const SERVICE_OPTIONS: Record<CategoryId, string[]> = {
  diesel: DIESEL_SERVICES,
  gas: GAS_SERVICES,
  'small-engine': SMALL_ENGINE_SERVICES,
  'heavy-equipment': HEAVY_EQUIPMENT_SERVICES,
  resurfacing: RESURFACING_SERVICES,
  welding: WELDING_SERVICES,
  tire: TIRE_SHOP_SERVICES,
};

const CATEGORY_CONFIG: Array<{ id: CategoryId; label: string; color: string; bg: string; hoverBg: string; border: string; badge?: string }> = [
  { id: 'diesel', label: 'Diesel / Heavy-Duty', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', hoverBg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.3)' },
  { id: 'gas', label: 'Gas / Automotive', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', hoverBg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.3)' },
  { id: 'small-engine', label: 'Small Engine', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', hoverBg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.3)' },
  { id: 'heavy-equipment', label: 'Heavy Equipment', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', hoverBg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.3)' },
  { id: 'resurfacing', label: 'Resurfacing / Machining', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', hoverBg: 'rgba(6,182,212,0.2)', border: 'rgba(6,182,212,0.3)' },
  { id: 'welding', label: 'Welding & Fabrication', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', hoverBg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.3)' },
  { id: 'tire', label: 'Tire Shop', color: '#f97316', bg: 'rgba(249,115,22,0.1)', hoverBg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.3)' },
];

interface Service {
  id: string;
  serviceName: string;
  category: string;
  price: number | null;
  duration?: number | null;
  description?: string | null;
}

function ShopSettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useRequireAuth(['shop']);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/shop/settings') {
      router.replace('/shop/admin/settings');
    }
  }, [router]);
  const [userName, setUserName] = useState('');
  const [shopId, setShopId] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [newService, setNewService] = useState({
    serviceName: '',
    customName: '',
    category: 'diesel' as CategoryId,
    price: ''
  });
  const [newServiceMode, setNewServiceMode] = useState<'catalog' | 'custom'>('catalog');
  const [editService, setEditService] = useState({
    price: '',
    duration: '',
    description: ''
  });
  const [settings, setSettings] = useState({
    shopName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    businessLicense: '',
    insurancePolicy: '',
    shopType: 'diesel',
    operatingHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: true },
    }
  });
  const defaultNotificationPreferences = {
    // Parts notifications
    lowInventory: true,
    partsDelivered: true,
    partsOrdered: true,
    // Customer work order notifications
    newRoadCallOrder: true,
    // Payment notifications
    paymentReceived: true,
    // Message notifications
    messages: true,
    // Work order status notifications
    workOrderCreated: true,
    workOrderStarted: true,
    workOrderCompleted: true,
    techArrived: true,
    techLeaving: true,
    estimateApproved: true,
    estimateRejected: true,
  };
  const [notifications, setNotifications] = useState(defaultNotificationPreferences);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [notificationSaveMessage, setNotificationSaveMessage] = useState('');
  const [pushStatus, setPushStatus] = useState('');

  // Subscription/Billing state
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    trialEnd: string | null;
    stripeCustomerId: string | null;
    cancelAtPeriodEnd: boolean;
  } | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isCustomService = (service: Service) => {
    const defaults = SERVICE_OPTIONS[service.category as CategoryId] || [];
    return !defaults.includes(service.serviceName);
  };

  const PLAN_DETAILS: Record<string, { name: string; price: number; features: string[]; maxUsers: number; color: string }> = {
    starter: {
      name: 'Starter',
      price: 99,
      maxUsers: 1,
      color: '#6B7280',
      features: ['1 User', '1 Shop', 'Basic Work Orders', 'Email Support']
    },
    growth: {
      name: 'Growth',
      price: 199,
      maxUsers: 5,
      color: '#3B82F6',
      features: ['Up to 5 Users', '1 Shop', 'Advanced Work Orders', 'Inventory Management', 'Priority Support']
    },
    professional: {
      name: 'Professional',
      price: 349,
      maxUsers: 15,
      color: '#8B5CF6',
      features: ['Up to 15 Users', '1 Shop', 'Full Features', 'Custom Reports', 'API Access', 'Phone Support']
    },
    business: {
      name: 'Business',
      price: 599,
      maxUsers: 40,
      color: '#F97316',
      features: ['Up to 40 Users', 'Up to 5 Shops', 'Multi-Location', 'Advanced Analytics', 'Dedicated Support']
    },
    enterprise: {
      name: 'Enterprise',
      price: 999,
      maxUsers: -1,
      color: '#EF4444',
      features: ['Unlimited Users', 'Unlimited Shops', 'White Label Options', 'Custom Integrations', '24/7 Support', 'SLA']
    }
  };

  useEffect(() => {
    if (!user?.shopId || settingsLoaded) return;
    setShopId(user.shopId);
    setLoading(true);
    loadSettings(user.shopId).finally(() => setSettingsLoaded(true));
  }, [user?.shopId, settingsLoaded]);

  useEffect(() => {
    if (user?.name) setUserName(user.name);
    if (user?.shopId) setShopId(user.shopId);
    
    // Handle payment return from Stripe
    const payment = searchParams?.get('payment');
    if (payment === 'success') {
      setActiveTab('billing');
      setPaymentMessage({ type: 'success', text: 'Payment successful! Your subscription has been updated.' });
      // Clear the URL params
      router.replace('/shop/settings', { scroll: false });
    } else if (payment === 'canceled') {
      setActiveTab('billing');
      setPaymentMessage({ type: 'error', text: 'Payment was canceled. Your subscription has not been changed.' });
      router.replace('/shop/settings', { scroll: false });
    }
     
  }, [router, searchParams]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e5e7eb',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

  const loadSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/shops/settings?shopId=${id}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          shopName: data.shop.shopName || '',
          email: data.shop.email || '',
          phone: data.shop.phone || '',
          address: data.shop.address || '',
          city: data.shop.city || '',
          state: data.shop.state || '',
          zipCode: data.shop.zipCode || '',
          businessLicense: data.shop.businessLicense || '',
          insurancePolicy: data.shop.insurancePolicy || '',
          shopType: data.shop.shopType || 'diesel',
          operatingHours: {
            monday: { open: '08:00', close: '18:00', closed: false },
            tuesday: { open: '08:00', close: '18:00', closed: false },
            wednesday: { open: '08:00', close: '18:00', closed: false },
            thursday: { open: '08:00', close: '18:00', closed: false },
            friday: { open: '08:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '14:00', closed: false },
            sunday: { open: '09:00', close: '14:00', closed: true },
          }
        });
        setServices(data.shop.services || []);
        if (data.settings) {
          setNotificationsEnabled(data.settings.notificationsEnabled ?? true);
          setNotificationSoundEnabled(data.settings.notificationSoundEnabled ?? true);
          setNotifications({
            ...defaultNotificationPreferences,
            ...(data.settings.notificationPreferences || {}),
          });
        }
        
        // Load subscription data
        if (data.shop.subscription) {
          setSubscription({
            plan: data.shop.subscription.plan || 'starter',
            status: data.shop.subscription.status || 'active',
            currentPeriodEnd: data.shop.subscription.currentPeriodEnd || null,
            trialEnd: data.shop.subscription.trialEnd || null,
            stripeCustomerId: data.shop.subscription.stripeCustomerId || null,
            cancelAtPeriodEnd: data.shop.subscription.cancelAtPeriodEnd || false,
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify({
          shopId,
          ...settings
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  const saveNotificationSettings = async (nextPreferences?: typeof notifications, nextEnabled?: boolean, nextSound?: boolean) => {
    try {
      const payload = {
        shopId,
        notificationSettings: {
          notificationsEnabled: nextEnabled ?? notificationsEnabled,
          notificationSoundEnabled: nextSound ?? notificationSoundEnabled,
          notificationPreferences: nextPreferences ?? notifications,
        },
      };

      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setNotificationSaveMessage('Notification settings saved.');
        setTimeout(() => setNotificationSaveMessage(''), 2000);
      } else {
        setNotificationSaveMessage('Failed to save notification settings.');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setNotificationSaveMessage('Failed to save notification settings.');
    }
  };

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => {
      const next = {
        ...prev,
        [key]: !prev[key as keyof typeof prev]
      };
      saveNotificationSettings(next);
      return next;
    });
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnablePush = async () => {
    try {
      setPushStatus('Requesting permission...');
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setPushStatus('Push not supported in this browser.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('Permission denied.');
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setPushStatus('Missing VAPID public key.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const readyRegistration = await navigator.serviceWorker.ready;
      const existingSubscription = await readyRegistration.pushManager.getSubscription();
      const subscription = existingSubscription || await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const userId = (user as any)?.id || (user as any)?.shopId || 'shop-admin';
      const shopHeader = (user as any)?.shopId || shopId || '';
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...(shopHeader ? { 'x-shop-id': shopHeader } : {}),
        },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save subscription');
      }

      setPushStatus('Push enabled for this browser.');
    } catch (error: any) {
      console.error('Enable push failed', error);
      setPushStatus(error?.message || 'Failed to enable push.');
    }
  };

  // Billing functions
  const openBillingPortal = async () => {
    if (!shopId) {
      alert('Missing shop ID. Please refresh and try again.');
      return;
    }

    setBillingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ shopId })
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error?.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Error opening billing portal');
    } finally {
      setBillingLoading(false);
    }
  };

  const upgradePlan = async (newPlan: string) => {
    setBillingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: newPlan,
          shopId,
          email: settings.email,
          shopName: settings.shopName
        })
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('Failed to start checkout');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Error upgrading plan');
    } finally {
      setBillingLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!shopId || !subscription?.stripeCustomerId) {
      alert('No active subscription found to cancel.');
      return;
    }

    const confirmCancel = window.confirm('Cancel subscription at period end? You will keep access until the current billing period ends.');
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subscriptions/${shopId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: 'user_requested', immediate: false }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription((prev) => prev ? { ...prev, cancelAtPeriodEnd: true, status: prev.status } : prev);
        alert('Subscription cancellation scheduled. You retain access until the period ends.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Error cancelling subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAddService = async () => {
    const serviceName = newServiceMode === 'custom' ? newService.customName.trim() : newService.serviceName.trim();
    if (!serviceName) {
      alert(newServiceMode === 'custom' ? 'Please enter a custom service name' : 'Please select a service from the dropdown');
      return;
    }

    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/services', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify({
          shopId,
          serviceName,
          category: newService.category,
          price: newService.price ? parseFloat(newService.price) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setServices([...services, data.service]);
        setShowAddServiceModal(false);
        setNewService({ serviceName: '', customName: '', category: 'diesel', price: '' });
        setNewServiceMode('catalog');
        alert('Service added successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add service');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Error adding service');
    }
  };

  const handlePopulateDefaults = async () => {
    if (!shopId) return alert('Shop ID not found');
    const toCreate = CATEGORY_CONFIG.flatMap((cat) =>
      (SERVICE_OPTIONS[cat.id] || []).map((s) => ({ serviceName: s, category: cat.id }))
    );

    let created = 0;
    for (const item of toCreate) {
      try {
        const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
        const res = await fetch('/api/shops/services', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
          body: JSON.stringify({ shopId, serviceName: item.serviceName, category: item.category }),
        });
        if (res.ok) created += 1;
      } catch (e) {
        // ignore individual errors
      }
    }
    alert(`Imported ${created} default services`);
    // reload services
    await loadSettings(shopId);
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to remove this service?')) return;

    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch(`/api/shops/services?serviceId=${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-token': csrf || '' },
      });

      if (response.ok) {
        setServices(services.filter(s => s.id !== serviceId));
        alert('Service removed successfully!');
      } else {
        alert('Failed to remove service');
      }
    } catch (error) {
      console.error('Error removing service:', error);
      alert('Error removing service');
    }
  };

  const handleOpenEditService = (service: Service) => {
    setSelectedService(service);
    setEditService({
      price: service.price?.toString() || '',
      duration: service.duration ? (service.duration / 60).toString() : '', // Convert minutes to hours for display
      description: service.description || ''
    });
    setShowEditServiceModal(true);
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/services', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          price: editService.price ? parseFloat(editService.price) : null,
          duration: editService.duration ? Math.round(parseFloat(editService.duration) * 60) : null, // Convert hours to minutes
          description: editService.description || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setServices(services.map(s => s.id === selectedService.id ? data.service : s));
        setShowEditServiceModal(false);
        setSelectedService(null);
        alert('Service updated successfully!');
      } else {
        alert('Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Error updating service');
    }
  };

  const tabs = [
    { id: 'general', icon: '🏢', name: 'General Info' },
    { id: 'hours', icon: '🕐', name: 'Operating Hours' },
    { id: 'services', icon: '🔧', name: 'Services' },
    { id: 'billing', icon: '💳', name: 'Billing & Plan' },
    { id: 'notifications', icon: '🔔', name: 'Notifications' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <div>
            <Link href="/shop/admin#overview" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:8, display:'inline-block'}}>
              ← Back to Dashboard
            </Link>
            <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>⚙️ Shop Settings</h1>
            <p style={{fontSize:14, color:'#9aa3b2'}}>Manage your shop information and preferences</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              localStorage.removeItem('userName');
              localStorage.removeItem('shopId');
              localStorage.removeItem('userId');
              router.push('/auth/login');
            }}
            style={{
              padding:'10px 20px',
              background:'#dc2626',
              color:'white',
              border:'none',
              borderRadius:8,
              fontSize:14,
              fontWeight:600,
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:8
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gridTemplateColumns:'250px 1fr', gap:24}}>
          {/* Sidebar */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, height:'fit-content'}}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  marginBottom:8,
                  background: activeTab === tab.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#9aa3b2',
                  border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer',
                  textAlign:'left',
                  display:'flex',
                  alignItems:'center',
                  gap:12
                }}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:32}}>
            {activeTab === 'general' && (
              <div>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>General Information</h2>
                
                <div style={{display:'grid', gap:20}}>
                  <div>
                    <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Shop Name</label>
                    <input type="text" value={settings.shopName} onChange={(e) => setSettings({...settings, shopName: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Email</label>
                      <input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Phone</label>
                      <input type="tel" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                  </div>

                  <div>
                    <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Address</label>
                    <input type="text" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>City</label>
                      <input type="text" value={settings.city} onChange={(e) => setSettings({...settings, city: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>State</label>
                      <input type="text" value={settings.state} onChange={(e) => setSettings({...settings, state: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>ZIP Code</label>
                      <input type="text" value={settings.zipCode} onChange={(e) => setSettings({...settings, zipCode: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Business License</label>
                      <input type="text" value={settings.businessLicense} onChange={(e) => setSettings({...settings, businessLicense: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Insurance Policy</label>
                      <input type="text" value={settings.insurancePolicy} onChange={(e) => setSettings({...settings, insurancePolicy: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Operating Hours</h2>
                
                {/* Schedule Settings Link */}
                <Link
                  href="/shop/settings/schedule"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)',
                    border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12,
                    textDecoration: 'none', transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>
                      📅 Advanced Scheduling Settings
                    </div>
                    <div style={{ fontSize: 13, color: '#9aa3b2' }}>
                      Manage capacity, time slots, blocked dates & customer booking availability
                    </div>
                  </div>
                  <span style={{ fontSize: 24, color: '#3b82f6' }}>→</span>
                </Link>
                
                <div style={{display:'grid', gap:16}}>
                  {Object.entries(settings.operatingHours).map(([day, hours]) => (
                    <div key={day} style={{display:'flex', alignItems:'center', gap:16, padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                      <div style={{width:100, fontSize:14, fontWeight:600, color:'#e5e7eb', textTransform:'capitalize'}}>{day}</div>
                      <input
                        type="time"
                        value={hours.open}
                        disabled={hours.closed}
                        onChange={e => {
                          setSettings({
                            ...settings,
                            operatingHours: {
                              ...settings.operatingHours,
                              [day]: { ...hours, open: e.target.value }
                            }
                          });
                        }}
                        style={{padding:'8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:13}}
                      />
                      <span style={{color:'#9aa3b2'}}>to</span>
                      <input
                        type="time"
                        value={hours.close}
                        disabled={hours.closed}
                        onChange={e => {
                          setSettings({
                            ...settings,
                            operatingHours: {
                              ...settings.operatingHours,
                              [day]: { ...hours, close: e.target.value }
                            }
                          });
                        }}
                        style={{padding:'8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:13}}
                      />
                      <label style={{display:'flex', alignItems:'center', gap:8, marginLeft:'auto', color:'#9aa3b2', cursor:'pointer'}}>
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={e => {
                            setSettings({
                              ...settings,
                              operatingHours: {
                                ...settings.operatingHours,
                                [day]: { ...hours, closed: e.target.checked }
                              }
                            });
                          }}
                          style={{width:18, height:18, cursor:'pointer'}}
                        />
                        Closed
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
                  <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Offered Services</h2>
                  <div style={{display:'flex', gap:12}}>
                    <button 
                      onClick={() => setShowAddServiceModal(true)}
                      style={{padding:'10px 20px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                    >
                      + Add Service
                    </button>
                    <button
                      onClick={handlePopulateDefaults}
                      style={{padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                      title="Import default services for all categories"
                    >
                      Import Default Services
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>Loading services...</div>
                ) : services.length === 0 ? (
                  <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
                    <div style={{fontSize:48, marginBottom:16}}>🔧</div>
                    <p style={{marginBottom:16}}>No services configured</p>
                    <button 
                      onClick={() => setShowAddServiceModal(true)}
                      style={{padding:'12px 24px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                    >
                      + Add First Service
                    </button>
                  </div>
                ) : (
                  <div style={{display:'grid', gap:24}}>
                    {services.some((s) => isCustomService(s)) && (
                      <div>
                        <h3 style={{fontSize:16, fontWeight:700, color:'#f59e0b', marginBottom:12}}>Custom Services ({services.filter(isCustomService).length})</h3>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12}}>
                          {services.filter(isCustomService).map((service) => (
                            <div
                              key={service.id}
                              onClick={() => handleOpenEditService(service)}
                              style={{
                                padding:12,
                                background:'rgba(245,158,11,0.1)',
                                border:'1px solid rgba(245,158,11,0.3)',
                                borderRadius:8,
                                display:'flex',
                                justifyContent:'space-between',
                                alignItems:'center',
                                cursor:'pointer',
                                transition:'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(245,158,11,0.2)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <div style={{display:'flex', alignItems:'center', gap:8, flex:1}}>
                                <span style={{color:'#f59e0b', fontSize:16}}>★</span>
                                <div>
                                  <div style={{color:'#e5e7eb', fontSize:14, fontWeight:600}}>{service.serviceName}</div>
                                  {(service.price || service.duration) && (
                                    <div style={{color:'#9aa3b2', fontSize:11, marginTop:2}}>
                                      {service.price && `$${service.price}`}
                                      {service.price && service.duration && ' • '}
                                      {service.duration && `${(service.duration / 60).toFixed(1)}h`}
                                    </div>
                                  )}
                                  <div style={{color:'#9aa3b2', fontSize:11, marginTop:4}}>Category: {service.category}</div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveService(service.id);
                                }}
                                style={{background:'transparent', border:'none', color:'#e5332a', cursor:'pointer', fontSize:18, padding:4}}
                                title="Remove service"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {CATEGORY_CONFIG.map((cat) => {
                      const filtered = services.filter((s) => s.category === cat.id && !isCustomService(s));
                      return (
                        <div key={cat.id}>
                          <h3 style={{fontSize:16, fontWeight:600, color:cat.color, marginBottom:12}}>
                            {cat.label} ({filtered.length})
                          </h3>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12}}>
                            {filtered.map((service) => (
                              <div
                                key={service.id}
                                onClick={() => handleOpenEditService(service)}
                                style={{
                                  padding:12,
                                  background: cat.bg,
                                  border:`1px solid ${cat.border}`,
                                  borderRadius:8,
                                  display:'flex',
                                  justifyContent:'space-between',
                                  alignItems:'center',
                                  cursor:'pointer',
                                  transition:'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = cat.hoverBg;
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = cat.bg;
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <div style={{display:'flex', alignItems:'center', gap:8, flex:1}}>
                                  <span style={{color:cat.color, fontSize:16}}>✓</span>
                                  <div>
                                    <div style={{color:'#e5e7eb', fontSize:14, fontWeight:600}}>{service.serviceName}</div>
                                    {(service.price || service.duration) && (
                                      <div style={{color:'#9aa3b2', fontSize:11, marginTop:2}}>
                                        {service.price && `$${service.price}`}
                                        {service.price && service.duration && ' • '}
                                        {service.duration && `${(service.duration / 60).toFixed(1)}h`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveService(service.id);
                                  }}
                                  style={{background:'transparent', border:'none', color:'#e5332a', cursor:'pointer', fontSize:18, padding:4}}
                                  title="Remove service"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {filtered.length === 0 && (
                              <div style={{padding:16, border:`1px dashed ${cat.border}`, borderRadius:8, color:'#9aa3b2', fontSize:13}}>
                                No services added yet for {cat.label}.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'billing' && (
              <div>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Billing & Subscription</h2>
                <p style={{color:'#9aa3b2', marginBottom:32}}>Manage your subscription plan and payment methods</p>

                {/* Payment Message */}
                {paymentMessage && (
                  <div style={{
                    padding: 16,
                    background: paymentMessage.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${paymentMessage.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 12,
                    marginBottom: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{paymentMessage.type === 'success' ? '✅' : '❌'}</span>
                      <span style={{ color: paymentMessage.type === 'success' ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                        {paymentMessage.text}
                      </span>
                    </div>
                    <button 
                      onClick={() => setPaymentMessage(null)}
                      style={{ background: 'transparent', border: 'none', color: '#9aa3b2', cursor: 'pointer', fontSize: 18 }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Current Plan Card */}
                <div style={{
                  background: `linear-gradient(135deg, ${PLAN_DETAILS[subscription?.plan || 'starter']?.color}20 0%, rgba(0,0,0,0.3) 100%)`,
                  border: `1px solid ${PLAN_DETAILS[subscription?.plan || 'starter']?.color}40`,
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 32
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16}}>
                    <div>
                      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                        <span style={{
                          fontSize:24,
                          fontWeight:700,
                          color: PLAN_DETAILS[subscription?.plan || 'starter']?.color
                        }}>
                          {PLAN_DETAILS[subscription?.plan || 'starter']?.name} Plan
                        </span>
                        <span style={{
                          padding:'4px 12px',
                          background: subscription?.status === 'active' ? 'rgba(34,197,94,0.2)' : 
                                     subscription?.status === 'trialing' ? 'rgba(59,130,246,0.2)' :
                                     subscription?.status === 'past_due' ? 'rgba(239,68,68,0.2)' : 'rgba(107,114,128,0.2)',
                          color: subscription?.status === 'active' ? '#22c55e' :
                                 subscription?.status === 'trialing' ? '#3b82f6' :
                                 subscription?.status === 'past_due' ? '#ef4444' : '#6b7280',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {subscription?.status || 'active'}
                        </span>
                      </div>
                      <div style={{color:'#e5e7eb', fontSize:32, fontWeight:700, marginBottom:4}}>
                        ${PLAN_DETAILS[subscription?.plan || 'starter']?.price}
                        <span style={{fontSize:16, fontWeight:400, color:'#9aa3b2'}}>/month</span>
                      </div>
                      <div style={{color:'#9aa3b2', fontSize:14}}>
                        {subscription?.status === 'trialing' && subscription?.trialEnd ? (
                          <>Trial ends {formatDate(subscription.trialEnd)}</>
                        ) : subscription?.currentPeriodEnd ? (
                          <>Next billing date: {formatDate(subscription.currentPeriodEnd)}</>
                        ) : (
                          <>Subscription active</>
                        )}
                      </div>
                      {subscription?.cancelAtPeriodEnd && (
                        <div style={{color:'#f59e0b', fontSize:13, marginTop:8, display:'flex', alignItems:'center', gap:6}}>
                          ⚠️ Cancels at end of billing period
                        </div>
                      )}
                    </div>
                    <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                      <button
                        onClick={openBillingPortal}
                        disabled={billingLoading}
                        style={{
                          padding:'12px 24px',
                          background:'#3b82f6',
                          color:'white',
                          border:'none',
                          borderRadius:8,
                          fontSize:14,
                          fontWeight:600,
                          cursor: billingLoading ? 'not-allowed' : 'pointer',
                          opacity: billingLoading ? 0.7 : 1,
                          display:'flex',
                          alignItems:'center',
                          gap:8
                        }}
                      >
                        {billingLoading ? '...' : '💳 Manage Billing'}
                      </button>
                      <button
                        onClick={cancelSubscription}
                        disabled={cancelling || !subscription?.stripeCustomerId || subscription?.cancelAtPeriodEnd}
                        style={{
                          padding:'12px 20px',
                          background: subscription?.cancelAtPeriodEnd ? 'rgba(239,68,68,0.2)' : '#ef4444',
                          color:'white',
                          border:'none',
                          borderRadius:10,
                          fontSize:14,
                          fontWeight:700,
                          cursor: (cancelling || subscription?.cancelAtPeriodEnd) ? 'not-allowed' : 'pointer',
                          opacity: (cancelling || subscription?.cancelAtPeriodEnd) ? 0.7 : 1,
                          display:'flex',
                          alignItems:'center',
                          gap:8
                        }}
                        title={subscription?.cancelAtPeriodEnd ? 'Cancellation already scheduled' : 'Cancel at period end'}
                      >
                        {subscription?.cancelAtPeriodEnd ? 'Cancellation Scheduled' : (cancelling ? 'Cancelling...' : 'Cancel Subscription')}
                      </button>
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div style={{marginTop:24, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                    <div style={{color:'#9aa3b2', fontSize:13, marginBottom:12}}>Your plan includes:</div>
                    <div style={{display:'flex', flexWrap:'wrap', gap:12}}>
                      {PLAN_DETAILS[subscription?.plan || 'starter']?.features.map((feature, i) => (
                        <span key={i} style={{
                          padding:'6px 12px',
                          background:'rgba(255,255,255,0.05)',
                          borderRadius:20,
                          fontSize:13,
                          color:'#e5e7eb',
                          display:'flex',
                          alignItems:'center',
                          gap:6
                        }}>
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upgrade Options */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#e5e7eb', marginBottom:16}}>
                    {subscription?.plan === 'enterprise' ? 'You\'re on our highest tier!' : 'Upgrade Your Plan'}
                  </h3>
                  
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16}}>
                    {Object.entries(PLAN_DETAILS)
                      .filter(([key]) => {
                        const planOrder = ['starter', 'growth', 'professional', 'business', 'enterprise'];
                        const currentIndex = planOrder.indexOf(subscription?.plan || 'starter');
                        const thisIndex = planOrder.indexOf(key);
                        return thisIndex > currentIndex;
                      })
                      .map(([key, plan]) => (
                        <div
                          key={key}
                          style={{
                            background:'rgba(0,0,0,0.3)',
                            border:`1px solid ${plan.color}30`,
                            borderRadius:12,
                            padding:20,
                            transition:'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = `${plan.color}60`;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = `${plan.color}30`;
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                            <div>
                              <div style={{color:plan.color, fontSize:18, fontWeight:700}}>{plan.name}</div>
                              <div style={{color:'#e5e7eb', fontSize:24, fontWeight:700}}>
                                ${plan.price}<span style={{fontSize:14, fontWeight:400, color:'#9aa3b2'}}>/mo</span>
                              </div>
                            </div>
                            {key === 'professional' && (
                              <span style={{
                                padding:'4px 8px',
                                background:'rgba(139,92,246,0.2)',
                                color:'#8B5CF6',
                                borderRadius:4,
                                fontSize:10,
                                fontWeight:700
                              }}>
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div style={{marginBottom:16}}>
                            {plan.features.slice(0, 3).map((f, i) => (
                              <div key={i} style={{color:'#9aa3b2', fontSize:13, marginBottom:4, display:'flex', alignItems:'center', gap:6}}>
                                <span style={{color:plan.color}}>✓</span> {f}
                              </div>
                            ))}
                            {plan.features.length > 3 && (
                              <div style={{color:'#6b7280', fontSize:12, marginTop:4}}>
                                +{plan.features.length - 3} more features
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => upgradePlan(key)}
                            disabled={billingLoading}
                            style={{
                              width:'100%',
                              padding:'10px',
                              background:`${plan.color}20`,
                              border:`1px solid ${plan.color}40`,
                              color:plan.color,
                              borderRadius:8,
                              fontSize:14,
                              fontWeight:600,
                              cursor:'pointer'
                            }}
                          >
                            Upgrade to {plan.name}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Payment History Link */}
                <div style={{
                  background:'rgba(255,255,255,0.05)',
                  borderRadius:12,
                  padding:20,
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center'
                }}>
                  <div>
                    <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Payment History & Invoices</div>
                    <div style={{color:'#9aa3b2', fontSize:13}}>View past invoices and download receipts</div>
                  </div>
                  <button
                    onClick={openBillingPortal}
                    disabled={billingLoading}
                    style={{
                      padding:'10px 20px',
                      background:'rgba(255,255,255,0.1)',
                      border:'1px solid rgba(255,255,255,0.2)',
                      color:'#e5e7eb',
                      borderRadius:8,
                      fontSize:14,
                      cursor: billingLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    View Invoices →
                  </button>
                </div>

                {/* FAQ Section */}
                <div style={{marginTop:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#e5e7eb', marginBottom:16}}>Billing FAQ</h3>
                  <div style={{display:'grid', gap:12}}>
                    <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
                      <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>When will I be charged?</div>
                      <div style={{color:'#9aa3b2', fontSize:13}}>
                        You get a 14-day free trial. After that, you&apos;ll be charged monthly on the same day you started.
                      </div>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
                      <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Can I cancel anytime?</div>
                      <div style={{color:'#9aa3b2', fontSize:13}}>
                        Yes! Cancel anytime from the billing portal. You&apos;ll keep access until the end of your billing period.
                      </div>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
                      <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>What payment methods do you accept?</div>
                      <div style={{color:'#9aa3b2', fontSize:13}}>
                        We accept all major credit cards (Visa, MasterCard, American Express) and ACH bank transfers.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Notification Preferences</h2>
                <p style={{color:'#9aa3b2', marginBottom:32}}>Choose which notifications you want to receive</p>

                <div style={{marginBottom:24, padding:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
                    <div>
                      <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Enable notifications for all shop users</div>
                      <div style={{color:'#9aa3b2', fontSize:13}}>Applies to techs and managers (bell icon + in-app alerts).</div>
                    </div>
                    <button
                      onClick={() => {
                        const next = !notificationsEnabled;
                        setNotificationsEnabled(next);
                        saveNotificationSettings(undefined, next);
                      }}
                      style={{padding:'10px 16px', background:notificationsEnabled ? '#16a34a' : '#334155', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontWeight:600, cursor:'pointer'}}
                    >
                      {notificationsEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <div style={{marginBottom:24, padding:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
                    <div>
                      <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Play audio chime</div>
                      <div style={{color:'#9aa3b2', fontSize:13}}>Plays a chime when new notifications arrive.</div>
                    </div>
                    <button
                      onClick={() => {
                        const next = !notificationSoundEnabled;
                        setNotificationSoundEnabled(next);
                        saveNotificationSettings(undefined, undefined, next);
                      }}
                      style={{padding:'10px 16px', background:notificationSoundEnabled ? '#16a34a' : '#334155', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontWeight:600, cursor:'pointer'}}
                    >
                      {notificationSoundEnabled ? 'Sound On' : 'Sound Off'}
                    </button>
                  </div>
                </div>

                <div style={{marginBottom:32, padding:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
                    <div>
                      <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Enable push notifications</div>
                      <div style={{color:'#9aa3b2', fontSize:13}}>Allow browser alerts for shop activity.</div>
                    </div>
                    <button onClick={handleEnablePush} style={{padding:'10px 16px', background:'#334155', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontWeight:600, cursor:'pointer'}}>
                      Enable
                    </button>
                  </div>
                  {pushStatus ? (
                    <div style={{marginTop:8, color:'#9aa3b2', fontSize:12}}>Status: {pushStatus}</div>
                  ) : null}
                  {notificationSaveMessage ? (
                    <div style={{marginTop:8, color:'#9aa3b2', fontSize:12}}>{notificationSaveMessage}</div>
                  ) : null}
                </div>

                {/* Parts Notifications */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#f59e0b', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>📦</span> Parts & Inventory
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Low Inventory Alert</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when parts inventory is running low</div>
                      </div>
                      <input type="checkbox" checked={notifications.lowInventory} onChange={() => handleNotificationToggle('lowInventory')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Parts Delivered</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when ordered parts arrive</div>
                      </div>
                      <input type="checkbox" checked={notifications.partsDelivered} onChange={() => handleNotificationToggle('partsDelivered')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Parts Ordered</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when team members order parts</div>
                      </div>
                      <input type="checkbox" checked={notifications.partsOrdered} onChange={() => handleNotificationToggle('partsOrdered')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>

                {/* Customer Work Orders */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#e5332a', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>🚨</span> Customer Work Orders
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>New Road Call Order</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when customers create new roadside assistance requests</div>
                      </div>
                      <input type="checkbox" checked={notifications.newRoadCallOrder} onChange={() => handleNotificationToggle('newRoadCallOrder')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>

                {/* Payment Notifications */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#22c55e', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>💳</span> Payments
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Payment Received</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when customers make payments</div>
                      </div>
                      <input type="checkbox" checked={notifications.paymentReceived} onChange={() => handleNotificationToggle('paymentReceived')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>

                {/* Message Notifications */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#60a5fa', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>💬</span> Messages
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>New Message Alerts</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Notify techs and managers when new messages arrive</div>
                      </div>
                      <input type="checkbox" checked={notifications.messages} onChange={() => handleNotificationToggle('messages')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>

                {/* Work Order Status Updates */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#3b82f6', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>📋</span> Work Order Status Updates
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Work Order Created</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>New work order has been created</div>
                      </div>
                      <input type="checkbox" checked={notifications.workOrderCreated} onChange={() => handleNotificationToggle('workOrderCreated')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Work Started</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Technician has started working on a job</div>
                      </div>
                      <input type="checkbox" checked={notifications.workOrderStarted} onChange={() => handleNotificationToggle('workOrderStarted')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Work Completed</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Work order has been completed</div>
                      </div>
                      <input type="checkbox" checked={notifications.workOrderCompleted} onChange={() => handleNotificationToggle('workOrderCompleted')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Tech Arrived</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Technician has arrived at the location</div>
                      </div>
                      <input type="checkbox" checked={notifications.techArrived} onChange={() => handleNotificationToggle('techArrived')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Tech Leaving</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Technician is leaving the location</div>
                      </div>
                      <input type="checkbox" checked={notifications.techLeaving} onChange={() => handleNotificationToggle('techLeaving')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Estimate Approved</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Customer has approved an estimate</div>
                      </div>
                      <input type="checkbox" checked={notifications.estimateApproved} onChange={() => handleNotificationToggle('estimateApproved')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Estimate Rejected</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Customer has rejected an estimate</div>
                      </div>
                      <input type="checkbox" checked={notifications.estimateRejected} onChange={() => handleNotificationToggle('estimateRejected')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div style={{marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <button onClick={handleSave} style={{padding:'12px 32px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Add New Service</h2>
              <button onClick={() => setShowAddServiceModal(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <div style={{display:'flex', gap:8, marginBottom:16}}>
              <button
                type="button"
                onClick={() => setNewServiceMode('catalog')}
                style={{
                  flex:1,
                  padding:'10px 12px',
                  borderRadius:8,
                  border: newServiceMode === 'catalog' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                  background: newServiceMode === 'catalog' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                  color:'#e5e7eb',
                  fontWeight:700,
                  cursor:'pointer'
                }}
              >
                Browse Catalog
              </button>
              <button
                type="button"
                onClick={() => setNewServiceMode('custom')}
                style={{
                  flex:1,
                  padding:'10px 12px',
                  borderRadius:8,
                  border: newServiceMode === 'custom' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                  background: newServiceMode === 'custom' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                  color:'#e5e7eb',
                  fontWeight:700,
                  cursor:'pointer'
                }}
              >
                Custom Service
              </button>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Service Category *</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12}}>
                {CATEGORY_CONFIG.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewService({ ...newService, category: cat.id, serviceName: '', customName: '' })}
                    style={{
                      padding:12,
                      background: newService.category === cat.id ? cat.bg : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${newService.category === cat.id ? cat.color : 'rgba(255,255,255,0.1)'}`,
                      borderRadius:8,
                      cursor:'pointer',
                      color:'#e5e7eb',
                      fontSize:13,
                      fontWeight:600,
                      textAlign:'left'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {newServiceMode === 'catalog' ? (
              <div style={{marginBottom:16}}>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Service Name *</label>
                <select 
                  value={newService.serviceName} 
                  onChange={(e) => setNewService({...newService, serviceName: e.target.value, customName: ''})} 
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                >
                  <option value="" disabled>Select a service...</option>
                  {(SERVICE_OPTIONS[newService.category] || []).map(service => (
                    <option key={service} value={service} style={{background:'rgba(0,0,0,0.8)', color:'#e5e7eb'}}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{marginBottom:16}}>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Custom Service Name *</label>
                <input
                  type="text"
                  value={newService.customName}
                  onChange={(e) => setNewService({...newService, customName: e.target.value, serviceName: ''})}
                  placeholder="e.g., Mobile Hydraulic Rescue"
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                />
              </div>
            )}

            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Price (Optional)</label>
              <input 
                type="number" 
                value={newService.price} 
                onChange={(e) => setNewService({...newService, price: e.target.value})} 
                placeholder="0.00"
                step="0.01"
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
            </div>

            <div style={{display:'flex', gap:12}}>
              <button 
                onClick={() => setShowAddServiceModal(false)} 
                style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddService} 
                style={{flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && selectedService && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:600, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <div>
                <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{selectedService.serviceName}</h2>
                <span style={{
                  padding:'4px 12px', 
                  background: selectedService.category === 'diesel' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', 
                  color: selectedService.category === 'diesel' ? '#22c55e' : '#3b82f6', 
                  borderRadius:12, 
                  fontSize:12, 
                  fontWeight:600
                }}>
                  {selectedService.category === 'diesel' ? '🚛 Diesel / Heavy-Duty' : '🚗 Gas / Automotive'}
                </span>
              </div>
              <button onClick={() => setShowEditServiceModal(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <p style={{color:'#9aa3b2', marginBottom:24, fontSize:14}}>Set labor time and pricing for this service</p>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Labor Duration (hours)</label>
              <input 
                type="number" 
                value={editService.duration} 
                onChange={(e) => setEditService({...editService, duration: e.target.value})} 
                placeholder="e.g., 2.5"
                step="0.25"
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
              <div style={{color:'#6b7280', fontSize:12, marginTop:4}}>Estimated time to complete this service</div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Service Price ($)</label>
              <input 
                type="number" 
                value={editService.price} 
                onChange={(e) => setEditService({...editService, price: e.target.value})} 
                placeholder="0.00"
                step="0.01"
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
              <div style={{color:'#6b7280', fontSize:12, marginTop:4}}>Standard pricing for this service (excluding parts)</div>
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Description / Notes</label>
              <textarea 
                value={editService.description} 
                onChange={(e) => setEditService({...editService, description: e.target.value})} 
                placeholder="Add any notes about this service..."
                rows={3}
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14, resize:'vertical'}} 
              />
            </div>

            <div style={{display:'flex', gap:12}}>
              <button 
                onClick={() => setShowEditServiceModal(false)} 
                style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateService} 
                style={{flex:1, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShopSettingsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopSettingsPageContent />
    </Suspense>
  );
}

export default ShopSettingsPageWrapper;
