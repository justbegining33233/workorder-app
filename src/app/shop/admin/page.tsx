'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MessagingCard from '@/components/MessagingCard';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function ShopAdminPage() {
  const { user, isLoading } = useRequireAuth(['shop']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [shopStats, setShopStats] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>({
    weeklyBudget: 0,
    monthlyBudget: 0,
    weeklySpent: 0,
    monthlySpent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'payroll' | 'team' | 'inventory'>('overview');
  
  // Date range for payroll
  const [payrollStartDate, setPayrollStartDate] = useState('');
  const [payrollEndDate, setPayrollEndDate] = useState('');
  
  // PDF generation
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Inventory management
  const [inventoryStock, setInventoryStock] = useState<any[]>([]);
  const [inventoryRequests, setInventoryRequests] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poForm, setPoForm] = useState({ vendor: '', itemName: '', quantity: 1, unitCost: 0, workOrderId: '' });
  const [workOrderSearch, setWorkOrderSearch] = useState('');
  const [workOrderOptions, setWorkOrderOptions] = useState<any[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Shop messages
  const [shopMessages, setShopMessages] = useState<any[]>([]);
  const [messageStats, setMessageStats] = useState<any>(null);

  // Team management
  const [teamData, setTeamData] = useState<any[]>([]);

  const getLiveHours = (emp: any) => {
    if (typeof emp?.currentHours === 'number' && !Number.isNaN(emp.currentHours)) {
      return emp.currentHours;
    }

    if (emp?.clockedInAt) {
      const start = new Date(emp.clockedInAt).getTime();
      if (!Number.isNaN(start)) {
        const hours = (Date.now() - start) / 36e5;
        return Math.max(0, hours);
      }
    }

    return 0;
  };

  // Keep tab selection in sync with URL hashes so sidebar anchor clicks switch cards
  const setTab = (tab: 'overview' | 'settings' | 'payroll' | 'team' | 'inventory') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '') as typeof activeTab;
      if (hash && ['overview', 'settings', 'payroll', 'team', 'inventory'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (user && !user.isShopAdmin) {
      router.replace('/shop/home');
      return;
    }

    const admin = localStorage.getItem('isShopAdmin');
    const id = localStorage.getItem('shopId');
    const name = localStorage.getItem('userName');
    const profileComplete = localStorage.getItem('shopProfileComplete') === 'true';

    if (admin !== 'true') {
      router.push('/shop/home');
      return;
    }

    if (!profileComplete) {
      router.push('/shop/complete-profile');
      return;
    }

    setShopId(id || '');
    setUserName(name || '');
    setUserId(id || ''); // Shop owner's userId is same as shopId
    fetchSettings(id || '');
    fetchShopStats(id || '');
    fetchBudgetData(id || '');
    fetchInventoryStock(id || '');
    fetchInventoryRequests(id || '');
    fetchPurchaseOrders(id || '');
    fetchWorkOrderOptions(id || '', '');
    fetchWorkOrderOptions(id || '', workOrderSearch);
    fetchPurchaseOrders(id || '');
    fetchShopMessages(id || '');
    fetchTeamData(id || '');
    
    // Set default date range (last 2 weeks)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    setPayrollEndDate(endDate.toISOString().split('T')[0]);
    setPayrollStartDate(startDate.toISOString().split('T')[0]);
    
    // Auto-fetch payroll data
    fetchPayrollData(id || '', startDate.toISOString(), endDate.toISOString());
    
    // Refresh clock-in data and stats every 5 seconds
    const interval = setInterval(() => {
      fetchShopStats(id || '');
      fetchBudgetData(id || '');
      fetchShopMessages(id || '');
      fetchTeamData(id || '');
      // Auto-refresh payroll with current date range
      const currentEnd = new Date();
      const currentStart = new Date(currentEnd.getTime() - 14 * 24 * 60 * 60 * 1000);
      fetchPayrollData(id || '', currentStart.toISOString(), currentEnd.toISOString());
    }, 5000);
    return () => clearInterval(interval);
  }, [router, user, isLoading]);

  const fetchShopStats = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Fetching shop stats with token:', token ? 'Token exists' : 'No token found');
      console.log('🏪 Shop ID:', id);
      
      const response = await fetch(`/api/shop/stats?shopId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('📊 Stats API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Shop stats loaded:', data);
        console.log('👥 Currently clocked in count:', data.team?.clockedIn);
        console.log('👥 Currently working list:', data.team?.currentlyWorking);
        setShopStats(data);
      } else {
        // Set empty data structure if fetch fails
        const errorText = await response.text();
        console.error('❌ Failed to fetch shop stats:', response.status, errorText);
        setShopStats({
          workOrders: { open: 0, completedToday: 0, completedThisWeek: 0, pendingApprovals: 0 },
          revenue: { today: 0, week: 0 },
          team: { total: 0, active: 0, clockedIn: 0, currentlyWorking: [] },
          inventory: { pendingRequests: 0 },
        });
      }
    } catch (error) {
      console.error('💥 Error fetching shop stats:', error);
      // Set empty data structure on error
      setShopStats({
        workOrders: { open: 0, completedToday: 0, completedThisWeek: 0, pendingApprovals: 0 },
        revenue: { today: 0, week: 0 },
        team: { total: 0, active: 0, clockedIn: 0, currentlyWorking: [] },
        inventory: { pendingRequests: 0 },
      });
    }
  };

  const fetchBudgetData = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch settings for budget limits
      const settingsResponse = await fetch(`/api/shop/settings?shopId=${id}`);
      const { settings } = await settingsResponse.json();
      
      // Calculate date ranges
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Fetch weekly payroll
      const weeklyResponse = await fetch(
        `/api/shop/payroll?shopId=${id}&startDate=${startOfWeek.toISOString()}&endDate=${now.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const weeklyData = await weeklyResponse.json();
      
      // Fetch monthly payroll
      const monthlyResponse = await fetch(
        `/api/shop/payroll?shopId=${id}&startDate=${startOfMonth.toISOString()}&endDate=${now.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const monthlyData = await monthlyResponse.json();
      
      setBudgetData({
        weeklyBudget: settings?.weeklyPayrollBudget || 0,
        monthlyBudget: settings?.monthlyPayrollBudget || 0,
        weeklySpent: weeklyData.summary?.totalPay || 0,
        monthlySpent: monthlyData.summary?.totalPay || 0,
      });
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  };

  const fetchInventoryStock = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const lowStockParam = showLowStockOnly ? '&lowStockOnly=true' : '';
      const response = await fetch(`/api/shop/inventory-stock?shopId=${id}${lowStockParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInventoryStock(data.items || data.inventory || []);
      }
    } catch (error) {
      console.error('Error fetching inventory stock:', error);
    }
  };

  const fetchInventoryRequests = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop/inventory-requests?shopId=${id}&status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInventoryRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching inventory requests:', error);
    }
  };

  const fetchWorkOrderOptions = async (id: string, searchTerm: string) => {
    if (!id) return;
    setLoadingWorkOrders(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/workorders?shopId=${id}&status=pending&limit=20${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setWorkOrderOptions(data.workOrders || []);
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const fetchPurchaseOrders = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders?shopId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchTeamData = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop/team?shopId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTeamData(data.team || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const fetchShopMessages = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop/messages?shopId=${id}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setShopMessages(data.messages || []);
        setMessageStats(data.stats || null);
      } else {
        setShopMessages([]);
        setMessageStats(null);
      }
    } catch (error) {
      console.error('Error fetching shop messages:', error);
      setShopMessages([]);
      setMessageStats(null);
    }
  };

  const fetchSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/shop/settings?shopId=${id}`);
      if (response.ok) {
        const { settings } = await response.json();
        setSettings(settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shop/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shopId, ...settings }),
      });

      if (response.ok) {
        alert('Settings updated successfully!');
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollData = async (id: string, start?: string, end?: string) => {
    try {
      const token = localStorage.getItem('token');
      const startDate = start ? new Date(start) : new Date(payrollStartDate);
      const endDate = end ? new Date(end) : new Date(payrollEndDate);

      const response = await fetch(
        `/api/shop/payroll?shopId=${id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayrollData(data);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    }
  };

  const handleRefreshPayroll = () => {
    setLoading(true);
    fetchPayrollData(shopId, payrollStartDate, payrollEndDate).finally(() => setLoading(false));
  };

  const downloadPayrollCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = new Date(payrollStartDate);
      const endDate = new Date(payrollEndDate);

      const response = await fetch(
        `/api/shop/payroll?shopId=${shopId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&format=csv`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll_${payrollStartDate}_to_${payrollEndDate}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error downloading CSV');
    }
  };

  const downloadPayrollPDF = async () => {
    if (!payrollData) return;
    
    setGeneratingPDF(true);
    try {
      // Dynamic import for client-side only
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Payroll Report', 14, 20);
      
      // Period
      doc.setFontSize(12);
      doc.text(`Period: ${payrollData.periodStart} to ${payrollData.periodEnd}`, 14, 30);
      doc.text(`Generated: ${new Date(payrollData.generatedAt).toLocaleString()}`, 14, 37);
      
      // Summary Box
      doc.setFillColor(59, 130, 246);
      doc.rect(14, 45, 60, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Total Employees', 16, 52);
      doc.setFontSize(16);
      doc.text(payrollData.summary.totalEmployees.toString(), 16, 62);
      
      doc.setFillColor(34, 197, 94);
      doc.rect(80, 45, 60, 25, 'F');
      doc.setFontSize(10);
      doc.text('Total Hours', 82, 52);
      doc.setFontSize(16);
      doc.text(payrollData.summary.totalHours.toFixed(2), 82, 62);
      
      doc.setFillColor(239, 68, 68);
      doc.rect(146, 45, 60, 25, 'F');
      doc.setFontSize(10);
      doc.text('Total Payroll', 148, 52);
      doc.setFontSize(16);
      doc.text(`$${payrollData.summary.totalPayroll.toFixed(2)}`, 148, 62);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Employee Details Table
      const tableData: any[] = [];
      payrollData.employees.forEach((emp: any) => {
        emp.entries.forEach((entry: any, idx: number) => {
          tableData.push([
            idx === 0 ? emp.name : '',
            idx === 0 ? emp.role : '',
            entry.date,
            entry.clockIn,
            entry.clockOut,
            entry.hours.toFixed(2),
            idx === 0 ? `$${emp.hourlyRate}` : '',
            `$${(entry.hours * emp.hourlyRate).toFixed(2)}`,
          ]);
        });
        // Subtotal row
        tableData.push([
          { content: `${emp.name} Total`, colSpan: 5, styles: { fontStyle: 'bold' } },
          { content: emp.totalHours.toFixed(2), styles: { fontStyle: 'bold' } },
          '',
          { content: `$${emp.totalPay.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [34, 197, 94] } },
        ]);
      });
      
      autoTable(doc, {
        startY: 75,
        head: [['Employee', 'Role', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Rate', 'Pay']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 41, 55] },
      });
      
      // Save
      doc.save(`payroll_${payrollStartDate}_to_${payrollEndDate}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleCreatePurchaseOrder = async () => {
    if (!shopId || !poForm.itemName) {
      alert('Shop ID and item name are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        shopId,
        vendor: poForm.vendor || undefined,
        createdById: userId,
        items: [
          {
            itemName: poForm.itemName,
            quantity: Number(poForm.quantity) || 0,
            unitCost: Number(poForm.unitCost) || 0,
            workOrderId: poForm.workOrderId || undefined,
          },
        ],
      };

      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setPoForm({ vendor: '', itemName: '', quantity: 1, unitCost: 0, workOrderId: '' });
        fetchPurchaseOrders(shopId);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order');
    }
  };

  const handleReceivePurchaseOrder = async (poId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiveItems: true, status: 'received' }),
      });

      if (response.ok) {
        fetchPurchaseOrders(shopId);
        fetchInventoryStock(shopId);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to receive purchase order');
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      alert('Failed to receive purchase order');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <TopNavBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} showMenuButton={true} />
      {/* Breadcrumbs */}
      <Breadcrumbs />
      {/* Main Layout with Sidebar */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Sidebar
          role="shop"
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectTab={(tab) => setTab(tab as typeof activeTab)}
          activeHash={`#${activeTab}`}
        />
        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setTab('overview')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'overview' ? 'rgba(229,51,42,0.2)' : 'transparent',
                  color: activeTab === 'overview' ? '#e5332a' : '#9aa3b2',
                  border: 'none',
                  borderBottom: activeTab === 'overview' ? '2px solid #e5332a' : 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setTab('settings')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'settings' ? 'rgba(229,51,42,0.2)' : 'transparent',
                  color: activeTab === 'settings' ? '#e5332a' : '#9aa3b2',
                  border: 'none',
                  borderBottom: activeTab === 'settings' ? '2px solid #e5332a' : 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setTab('payroll')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'payroll' ? 'rgba(229,51,42,0.2)' : 'transparent',
                  color: activeTab === 'payroll' ? '#e5332a' : '#9aa3b2',
                  border: 'none',
                  borderBottom: activeTab === 'payroll' ? '2px solid #e5332a' : 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                💰 Payroll
              </button>
              <button
                onClick={() => setTab('team')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'team' ? 'rgba(229,51,42,0.2)' : 'transparent',
                  color: activeTab === 'team' ? '#e5332a' : '#9aa3b2',
                  border: 'none',
                  borderBottom: activeTab === 'team' ? '2px solid #e5332a' : 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                👥 Team
              </button>
              <button
                onClick={() => {
                  setTab('inventory');
                  fetchInventoryStock(shopId);
                  fetchInventoryRequests(shopId);
                }}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'inventory' ? 'rgba(229,51,42,0.2)' : 'transparent',
                  color: activeTab === 'inventory' ? '#e5332a' : '#9aa3b2',
                  border: 'none',
                  borderBottom: activeTab === 'inventory' ? '2px solid #e5332a' : 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                📦 Inventory
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div>
                {!shopStats ? (
                  <div style={{ textAlign: 'center', padding: 64, color: '#9aa3b2' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                    <div style={{ fontSize: 18, marginBottom: 8 }}>Loading shop statistics...</div>
                    <div style={{ fontSize: 14 }}>Please wait while we fetch your data</div>
                  </div>
                ) : (
                  <>
                    {/* Key Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                      <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Open Work Orders</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>{shopStats.workOrders.open}</div>
                      </div>
                      <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Completed Today</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>{shopStats.workOrders.completedToday}</div>
                      </div>
                      <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Today's Revenue</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>${shopStats.revenue.today.toFixed(2)}</div>
                      </div>
                      <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>This Week</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#a855f7' }}>${shopStats.revenue.week.toFixed(2)}</div>
                      </div>
                      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Team Members</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{shopStats.team.total}</div>
                        <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>{shopStats.team.clockedIn} clocked in</div>
                      </div>
                      <div style={{ background: 'rgba(229,51,42,0.1)', border: '1px solid rgba(229,51,42,0.3)', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Pending Actions</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#e5332a' }}>
                          {shopStats.workOrders.pendingApprovals + shopStats.inventory.pendingRequests}
                        </div>
                        <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>
                          {shopStats.workOrders.pendingApprovals} orders, {shopStats.inventory.pendingRequests} inventory
                        </div>
                      </div>
                      <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>Inventory Items</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#6366f1' }}>{inventoryStock.length}</div>
                        <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>
                          {inventoryStock.filter((item: any) => item.quantity <= item.reorderPoint).length} low stock
                        </div>
                      </div>
                    </div>

                    {/* Inventory Summary Card */}
                    <div style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: 12, 
                      padding: 24, 
                      marginBottom: 24 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: 24 }}>📦</div>
                          <div>
                            <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Current Inventory</h3>
                            <div style={{ color: '#9aa3b2', fontSize: 13 }}>Parts and supplies in stock</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setTab('inventory')}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(99,102,241,0.2)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: 8,
                            color: '#6366f1',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + Add Inventory
                        </button>
                      </div>

                      {inventoryStock.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: '#9aa3b2' }}>
                          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                          <div>No inventory items yet</div>
                          <div style={{ fontSize: 13 }}>Click "Add Inventory" to start tracking parts and supplies</div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 16 }}>
                            {/* Total Value */}
                            <div style={{ 
                              background: 'rgba(34,197,94,0.1)', 
                              border: '1px solid rgba(34,197,94,0.3)', 
                              borderRadius: 8, 
                              padding: 16 
                            }}>
                              <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Total Value</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                                ${inventoryStock.reduce((sum: number, item: any) => sum + (item.quantity * item.sellingPrice), 0).toFixed(2)}
                              </div>
                              <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>
                                {inventoryStock.reduce((sum: number, item: any) => sum + item.quantity, 0)} total units
                              </div>
                            </div>

                            {/* Low Stock Alert */}
                            <div style={{ 
                              background: 'rgba(245,158,11,0.1)', 
                              border: '1px solid rgba(245,158,11,0.3)', 
                              borderRadius: 8, 
                              padding: 16 
                            }}>
                              <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Low Stock Items</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                                {inventoryStock.filter((item: any) => item.quantity <= item.reorderPoint).length}
                              </div>
                              <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>Need reorder</div>
                            </div>

                            {/* Suppliers */}
                            <div style={{ 
                              background: 'rgba(99,102,241,0.1)', 
                              border: '1px solid rgba(99,102,241,0.3)', 
                              borderRadius: 8, 
                              padding: 16 
                            }}>
                              <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Suppliers</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>
                                {new Set(inventoryStock.filter((item: any) => item.supplier).map((item: any) => item.supplier)).size}
                              </div>
                              <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>Active vendors</div>
                            </div>

                            {/* Categories */}
                            <div style={{ 
                              background: 'rgba(168,85,247,0.1)', 
                              border: '1px solid rgba(168,85,247,0.3)', 
                              borderRadius: 8, 
                              padding: 16 
                            }}>
                              <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Categories</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7' }}>
                                {new Set(inventoryStock.filter((item: any) => item.category).map((item: any) => item.category)).size}
                              </div>
                              <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>Item types</div>
                            </div>
                          </div>

                          {/* Quick View Table */}
                          <div style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            borderRadius: 8, 
                            overflow: 'hidden',
                            maxHeight: 300,
                            overflowY: 'auto'
                          }}>
                            <table style={{ width: '100%', fontSize: 13 }}>
                              <thead style={{ background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0 }}>
                                <tr>
                                  <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Item</th>
                                  <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>SKU</th>
                                  <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Quantity</th>
                                  <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Cost/Sell</th>
                                  <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Supplier</th>
                                  <th style={{ padding: 12, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inventoryStock.slice(0, 10).map((item: any) => (
                                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: 12, color: '#e5e7eb' }}>{item.itemName}</td>
                                    <td style={{ padding: 12, color: '#9aa3b2' }}>{item.sku || '-'}</td>
                                    <td style={{ padding: 12, color: item.quantity <= item.reorderPoint ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                                      {item.quantity}
                                    </td>
                                    <td style={{ padding: 12, color: '#9aa3b2', fontSize: 12 }}>
                                      <div>${item.unitCost?.toFixed(2) || '0.00'}</div>
                                      <div style={{ color: '#60a5fa' }}>${item.sellingPrice?.toFixed(2) || '0.00'}</div>
                                    </td>
                                    <td style={{ padding: 12, color: '#9aa3b2' }}>{item.supplier || '-'}</td>
                                    <td style={{ padding: 12 }}>
                                      {item.quantity <= item.reorderPoint ? (
                                        <span style={{ 
                                          padding: '4px 8px', 
                                          background: 'rgba(245,158,11,0.2)', 
                                          border: '1px solid rgba(245,158,11,0.3)',
                                          borderRadius: 4,
                                          fontSize: 11,
                                          color: '#f59e0b',
                                          fontWeight: 600
                                        }}>
                                          LOW STOCK
                                        </span>
                                      ) : (
                                        <span style={{ 
                                          padding: '4px 8px', 
                                          background: 'rgba(34,197,94,0.2)', 
                                          border: '1px solid rgba(34,197,94,0.3)',
                                          borderRadius: 4,
                                          fontSize: 11,
                                          color: '#22c55e',
                                          fontWeight: 600
                                        }}>
                                          IN STOCK
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {inventoryStock.length > 10 && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                              <button
                                onClick={() => setTab('inventory')}
                                style={{
                                  padding: '8px 16px',
                                  background: 'transparent',
                                  border: '1px solid rgba(99,102,241,0.3)',
                                  borderRadius: 8,
                                  color: '#6366f1',
                                  fontSize: 13,
                                  cursor: 'pointer',
                                }}
                              >
                                View All {inventoryStock.length} Items →
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Parts and Set Labor (overview) */}
                    <div style={{background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20, marginBottom:24}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                        <div>
                          <div style={{fontSize:14, fontWeight:700, color:'#e5e7eb'}}>Parts and Set Labor</div>
                          <div style={{fontSize:12, color:'#9aa3b2'}}>Quick glance at stock and labor items</div>
                        </div>
                        <span style={{padding:'4px 10px', background:'rgba(229,51,42,0.2)', color:'#e5332a', borderRadius:10, fontSize:11, fontWeight:700}}>
                          {inventoryStock.filter((item: any) => item.quantity <= (item.reorderPoint || 0)).length} Alerts
                        </span>
                      </div>

                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12}}>
                        {inventoryStock.slice(0, 6).map((item: any, idx: number) => {
                          const critical = item.quantity <= (item.reorderPoint || 0) / 2;
                          const low = item.quantity <= (item.reorderPoint || 0) && !critical;
                          const border = critical ? 'rgba(229,51,42,0.3)' : low ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)';
                          const text = critical ? '#e5332a' : low ? '#f59e0b' : '#22c55e';
                          const badgeBg = critical ? 'rgba(229,51,42,0.18)' : low ? 'rgba(245,158,11,0.18)' : 'rgba(34,197,94,0.18)';
                          const badgeLabel = critical ? 'Critical' : low ? 'Low' : 'Good';
                          return (
                            <div key={idx} style={{background:'rgba(255,255,255,0.03)', border:`1px solid ${border}`, borderRadius:10, padding:12}}>
                              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                                <div style={{fontSize:13, fontWeight:700, color:'#e5e7eb'}}>{item.itemName || 'Part'}</div>
                                <span style={{padding:'3px 8px', background:badgeBg, color:text, borderRadius:8, fontSize:11, fontWeight:700}}>{badgeLabel}</span>
                              </div>
                              <div style={{fontSize:12, color:'#9aa3b2', marginBottom:6}}>SKU: {item.sku || '—'}</div>
                              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div style={{fontSize:11, color:'#9aa3b2'}}>On Hand</div>
                                <div style={{fontSize:16, fontWeight:700, color:text}}>{item.quantity}</div>
                              </div>
                              <div style={{fontSize:11, color:'#9aa3b2'}}>Reorder at: {item.reorderPoint ?? 0}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{marginTop:16, display:'flex', gap:12}}>
                        <Link href="/shop/parts-labor">
                          <button style={{padding:'10px 14px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer'}}>
                            Open Parts & Labor →
                          </button>
                        </Link>
                        <button
                          onClick={() => setTab('inventory')}
                          style={{padding:'10px 14px', background:'rgba(255,255,255,0.06)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer'}}
                        >
                          Go to Inventory →
                        </button>
                      </div>
                    </div>

                    {/* Shop Communications - MessagingCard */}
                    <div style={{ marginBottom: 24 }}>
                      <MessagingCard userId={userId} shopId={shopId} />
                    </div>

                    {/* Budget Tracking */}
                    {budgetData && (budgetData.weeklyBudget > 0 || budgetData.monthlyBudget > 0) && (
                      <div style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        borderRadius: 12, 
                        padding: 24, 
                        marginBottom: 24 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                          <div style={{ fontSize: 24 }}>💰</div>
                          <div>
                            <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Payroll Budget Tracking</h3>
                            <div style={{ color: '#9aa3b2', fontSize: 13 }}>Monitor spending against budget limits</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                          {/* Weekly Budget */}
                          {budgetData.weeklyBudget > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>Weekly Budget</span>
                                <span style={{ 
                                  color: budgetData.weeklySpent > budgetData.weeklyBudget ? '#ef4444' : 
                                         budgetData.weeklySpent / budgetData.weeklyBudget > 0.9 ? '#f59e0b' : '#22c55e',
                                  fontSize: 14,
                                  fontWeight: 600
                                }}>
                                  ${budgetData.weeklySpent.toFixed(2)} / ${budgetData.weeklyBudget.toFixed(2)}
                                </span>
                              </div>
                              <div style={{ 
                                width: '100%', 
                                height: 24, 
                                background: 'rgba(255,255,255,0.1)', 
                                borderRadius: 12, 
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <div style={{
                                  width: `${Math.min(100, (budgetData.weeklySpent / budgetData.weeklyBudget) * 100)}%`,
                                  height: '100%',
                                  background: budgetData.weeklySpent > budgetData.weeklyBudget ? 
                                    'linear-gradient(90deg, #ef4444, #dc2626)' :
                                    budgetData.weeklySpent / budgetData.weeklyBudget > 0.9 ?
                                    'linear-gradient(90deg, #f59e0b, #d97706)' :
                                    'linear-gradient(90deg, #22c55e, #16a34a)',
                                  transition: 'width 0.3s ease',
                                }} />
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'white',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                }}>
                                  {Math.min(100, Math.round((budgetData.weeklySpent / budgetData.weeklyBudget) * 100))}%
                                </div>
                              </div>
                              {budgetData.weeklySpent > budgetData.weeklyBudget && (
                                <div style={{ 
                                  marginTop: 8, 
                                  padding: 8, 
                                  background: 'rgba(239,68,68,0.1)', 
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8
                                }}>
                                  <span>⚠️</span>
                                  <span>Over budget by ${(budgetData.weeklySpent - budgetData.weeklyBudget).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Monthly Budget */}
                          {budgetData.monthlyBudget > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>Monthly Budget</span>
                                <span style={{ 
                                  color: budgetData.monthlySpent > budgetData.monthlyBudget ? '#ef4444' : 
                                         budgetData.monthlySpent / budgetData.monthlyBudget > 0.9 ? '#f59e0b' : '#22c55e',
                                  fontSize: 14,
                                  fontWeight: 600
                                }}>
                                  ${budgetData.monthlySpent.toFixed(2)} / ${budgetData.monthlyBudget.toFixed(2)}
                                </span>
                              </div>
                              <div style={{ 
                                width: '100%', 
                                height: 24, 
                                background: 'rgba(255,255,255,0.1)', 
                                borderRadius: 12, 
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <div style={{
                                  width: `${Math.min(100, (budgetData.monthlySpent / budgetData.monthlyBudget) * 100)}%`,
                                  height: '100%',
                                  background: budgetData.monthlySpent > budgetData.monthlyBudget ? 
                                    'linear-gradient(90deg, #ef4444, #dc2626)' :
                                    budgetData.monthlySpent / budgetData.monthlyBudget > 0.9 ?
                                    'linear-gradient(90deg, #f59e0b, #d97706)' :
                                    'linear-gradient(90deg, #22c55e, #16a34a)',
                                  transition: 'width 0.3s ease',
                                }} />
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'white',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                }}>
                                  {Math.min(100, Math.round((budgetData.monthlySpent / budgetData.monthlyBudget) * 100))}%
                                </div>
                              </div>
                              {budgetData.monthlySpent > budgetData.monthlyBudget && (
                                <div style={{ 
                                  marginTop: 8, 
                                  padding: 8, 
                                  background: 'rgba(239,68,68,0.1)', 
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8
                                }}>
                                  <span>⚠️</span>
                                  <span>Over budget by ${(budgetData.monthlySpent - budgetData.monthlyBudget).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Budget Alert Banner */}
                        {(budgetData.weeklySpent > budgetData.weeklyBudget || budgetData.monthlySpent > budgetData.monthlyBudget) && (
                          <div style={{
                            marginTop: 20,
                            padding: 16,
                            background: 'rgba(239,68,68,0.15)',
                            border: '2px solid rgba(239,68,68,0.4)',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                          }}>
                            <div style={{ fontSize: 32 }}>🚨</div>
                            <div>
                              <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                                Budget Alert: Payroll Spending Exceeded
                              </div>
                              <div style={{ color: '#e5e7eb', fontSize: 13 }}>
                                Review your payroll expenses and consider adjusting team schedules or budget limits.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      {/* Currently Clocked In */}
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                          <div style={{ fontSize: 24 }}>⏰</div>
                          <div>
                            <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Currently Clocked In</h3>
                            <div style={{ color: '#9aa3b2', fontSize: 13 }}>{shopStats.team.clockedIn} employees working</div>
                          </div>
                        </div>

                        {shopStats.team.currentlyWorking.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: 32, color: '#9aa3b2' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🕐</div>
                            <div>No one currently clocked in</div>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 8 }}>
                            {shopStats.team.currentlyWorking.map((emp: any) => (
                              <div key={emp.id} style={{ 
                                background: 'rgba(34,197,94,0.1)', 
                                border: '1px solid rgba(34,197,94,0.3)', 
                                borderRadius: 8, 
                                padding: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    background: 'rgba(34,197,94,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16
                                  }}>
                                    {emp.role === 'manager' ? '👔' : '🔧'}
                                  </div>
                                  <div>
                                    <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                                      Clocked in at {new Date(emp.clockedInAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>
                                  {getLiveHours(emp).toFixed(1)}h
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                          <div style={{ fontSize: 24 }}>⚡</div>
                          <div>
                            <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Quick Actions</h3>
                            <div style={{ color: '#9aa3b2', fontSize: 13 }}>Common tasks and shortcuts</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                          <button
                            onClick={() => setTab('team')}
                            style={{
                              width: '100%',
                              padding: 16,
                              background: 'rgba(59,130,246,0.2)',
                              border: '1px solid rgba(59,130,246,0.3)',
                              borderRadius: 8,
                              color: '#3b82f6',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <span style={{ fontSize: 20 }}>👥</span>
                            <div>
                              <div>Manage Team</div>
                              <div style={{ fontSize: 11, opacity: 0.8 }}>Add or edit team members</div>
                            </div>
                          </button>

                          <button
                            onClick={() => setTab('payroll')}
                            style={{
                              width: '100%',
                              padding: 16,
                              background: 'rgba(34,197,94,0.2)',
                              border: '1px solid rgba(34,197,94,0.3)',
                              borderRadius: 8,
                              color: '#22c55e',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <span style={{ fontSize: 20 }}>💰</span>
                            <div>
                              <div>Generate Payroll</div>
                              <div style={{ fontSize: 11, opacity: 0.8 }}>Download employee hours report</div>
                            </div>
                          </button>

                          <button
                            onClick={() => setTab('settings')}
                            style={{
                              width: '100%',
                              padding: 16,
                              background: 'rgba(168,85,247,0.2)',
                              border: '1px solid rgba(168,85,247,0.3)',
                              borderRadius: 8,
                              color: '#a855f7',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <span style={{ fontSize: 20 }}>⚙️</span>
                            <div>
                              <div>Shop Settings</div>
                              <div style={{ fontSize: 11, opacity: 0.8 }}>Configure rates and margins</div>
                            </div>
                          </button>

                          {shopStats.inventory.pendingRequests > 0 && (
                            <Link href="/shop/home" style={{ textDecoration: 'none' }}>
                              <button style={{
                                width: '100%',
                                padding: 16,
                                background: 'rgba(229,51,42,0.2)',
                                border: '1px solid rgba(229,51,42,0.3)',
                                borderRadius: 8,
                                color: '#e5332a',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ fontSize: 20 }}>📦</span>
                                  <div>
                                    <div>Pending Inventory Requests</div>
                                    <div style={{ fontSize: 11, opacity: 0.8 }}>Requires approval</div>
                                  </div>
                                </div>
                                <div style={{
                                  padding: '4px 12px',
                                  background: '#e5332a',
                                  borderRadius: 12,
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}>
                                  {shopStats.inventory.pendingRequests}
                                </div>
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && settings && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 32 }}>
                <h2 style={{ color: '#e5e7eb', marginBottom: 24, fontSize: 24 }}>Shop Settings</h2>

                <div style={{ display: 'grid', gap: 24 }}>
                  <div>
                    <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                      Default Labor Rate (per hour)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultLaborRate}
                      onChange={(e) => setSettings({ ...settings, defaultLaborRate: parseFloat(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                      Inventory Markup (0-5, e.g., 0.30 = 30%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.01"
                      value={settings.inventoryMarkup}
                      onChange={(e) => setSettings({ ...settings, inventoryMarkup: parseFloat(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                      Weekly Payroll Budget ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.weeklyPayrollBudget || ''}
                      onChange={(e) => setSettings({ ...settings, weeklyPayrollBudget: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="e.g., 5000"
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                      Monthly Payroll Budget ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.monthlyPayrollBudget || ''}
                      onChange={(e) => setSettings({ ...settings, monthlyPayrollBudget: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="e.g., 20000"
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                      }}
                    />
                  </div>

                  {/* GPS Verification Settings */}
                  <div style={{ 
                    marginTop: 24, 
                    paddingTop: 24, 
                    borderTop: '1px solid rgba(255,255,255,0.1)' 
                  }}>
                    <h3 style={{ color: '#e5e7eb', marginBottom: 16, fontSize: 18 }}>📍 GPS Verification</h3>
                    
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e5e7eb', cursor: 'pointer', marginBottom: 16 }}>
                        <input
                          type="checkbox"
                          checked={settings.gpsVerificationEnabled || false}
                          onChange={(e) => setSettings({ ...settings, gpsVerificationEnabled: e.target.checked })}
                        />
                        Enable GPS verification for clock in/out
                      </label>
                    </div>

                    {settings.gpsVerificationEnabled && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                            Shop Latitude
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={settings.shopLatitude || ''}
                            onChange={(e) => setSettings({ ...settings, shopLatitude: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder="e.g., 40.7128"
                            style={{
                              width: '100%',
                              padding: 12,
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.2)',
                              background: 'rgba(0,0,0,0.3)',
                              color: 'white',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                            Shop Longitude
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={settings.shopLongitude || ''}
                            onChange={(e) => setSettings({ ...settings, shopLongitude: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder="e.g., -74.0060"
                            style={{
                              width: '100%',
                              padding: 12,
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.2)',
                              background: 'rgba(0,0,0,0.3)',
                              color: 'white',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                            Radius (meters)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={settings.gpsRadiusMeters || 100}
                            onChange={(e) => setSettings({ ...settings, gpsRadiusMeters: parseInt(e.target.value) })}
                            style={{
                              width: '100%',
                              padding: 12,
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.2)',
                              background: 'rgba(0,0,0,0.3)',
                              color: 'white',
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div style={{ color: '#9aa3b2', fontSize: 12, marginTop: 8 }}>
                      Employees must be within the specified radius to clock in/out.
                    </div>
                  </div>

                  <button
                    onClick={handleUpdateSettings}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      background: '#e5332a',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Payroll Tab */}
            {activeTab === 'payroll' && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ color: '#e5e7eb', fontSize: 24, margin: 0 }}>💰 Payroll Report</h2>
                    <div style={{ color: '#9aa3b2', fontSize: 13, marginTop: 4 }}>Live view • Updates every 5 seconds</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleRefreshPayroll}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {loading ? '⟳ Refreshing...' : '🔄 Refresh Now'}
                    </button>
                    {payrollData && payrollData.employees.length > 0 && (
                      <>
                        <button
                          onClick={downloadPayrollCSV}
                          style={{
                            padding: '10px 20px',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          📥 Download CSV
                        </button>
                        <button
                          onClick={downloadPayrollPDF}
                          disabled={generatingPDF}
                          style={{
                            padding: '10px 20px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: generatingPDF ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {generatingPDF ? 'Generating...' : '📄 Download PDF'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Date Range Picker */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 8 }}>
                  <div>
                    <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={payrollStartDate}
                      onChange={(e) => setPayrollStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={payrollEndDate}
                      onChange={(e) => setPayrollEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                      }}
                    />
                  </div>
                </div>

                {(!payrollData || payrollData.employees.length === 0) && (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
                    <div style={{ color: '#9aa3b2', fontSize: 16 }}>No completed time entries found</div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
                      Time entries will appear here once employees clock out
                    </div>
                  </div>
                )}

                {payrollData && payrollData.employees.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Employees</div>
                          <div style={{ color: '#e5e7eb', fontSize: 24, fontWeight: 700 }}>{payrollData.summary.totalEmployees}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Hours</div>
                          <div style={{ color: '#3b82f6', fontSize: 24, fontWeight: 700 }}>{payrollData.summary.totalHours.toFixed(1)}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Payroll</div>
                          <div style={{ color: '#22c55e', fontSize: 24, fontWeight: 700 }}>${payrollData.summary.totalPayroll.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: 14 }}>
                        <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <tr>
                            <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Employee</th>
                            <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontWeight: 600 }}>Role</th>
                            <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontWeight: 600 }}>Total Hours</th>
                            <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontWeight: 600 }}>Rate</th>
                            <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontWeight: 600 }}>Total Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payrollData.employees.map((emp: any) => (
                            <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: 16, color: '#e5e7eb', fontWeight: 600 }}>{emp.name}</td>
                              <td style={{ padding: 16, color: '#9aa3b2' }}>
                                {emp.role === 'manager' ? '👔 Manager' : '🔧 Tech'}
                              </td>
                              <td style={{ padding: 16, textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>
                                {emp.totalHours.toFixed(1)}
                              </td>
                              <td style={{ padding: 16, textAlign: 'center', color: '#9aa3b2' }}>
                                ${emp.hourlyRate || 0}
                              </td>
                              <td style={{ padding: 16, textAlign: 'center', color: '#22c55e', fontWeight: 700, fontSize: 16 }}>
                                ${emp.totalPay.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Team Management Tab */}
            {activeTab === 'team' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ color: '#e5e7eb', fontSize: 24, margin: 0 }}>👥 Team Management</h2>
                  <Link href="/shop/manage-team" style={{
                    padding: '10px 20px',
                    background: 'rgba(59,130,246,0.2)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14
                  }}>
                    ➕ Add Team Member
                  </Link>
                </div>

                {teamData.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                    <div style={{ color: '#9aa3b2', fontSize: 16 }}>No team members found</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 16 }}>
                    {teamData.map((member: any) => (
                      <div key={member.id} style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: member.isClockedIn ? '2px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: 24
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24 }}>
                          {/* Member Info */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <div style={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                background: member.role === 'manager' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20
                              }}>
                                {member.role === 'manager' ? '👔' : '🔧'}
                              </div>
                              <div>
                                <div style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700 }}>{member.name}</div>
                                <div style={{ color: '#9aa3b2', fontSize: 13, marginTop: 2 }}>
                                  {member.role === 'manager' ? 'Manager' : 'Technician'}
                                </div>
                              </div>
                            </div>
                            {member.isClockedIn && (
                              <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                🟢 Currently Clocked In
                              </div>
                            )}
                            <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                              📧 {member.email}
                            </div>
                            <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                              📞 {member.phone || 'No phone'}
                            </div>
                            {member.isClockedIn && member.clockedInLocation && (
                              <div style={{ color: '#9aa3b2', fontSize: 12, marginTop: 4 }}>
                                📍 {member.clockedInLocation}
                              </div>
                            )}
                            {member.isClockedIn && member.clockedInNotes && (
                              <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                                📝 {member.clockedInNotes}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Weekly Hours</div>
                            <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 18 }}>
                              {member.weeklyHours.toFixed(1)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Hourly Rate</div>
                            <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 16 }}>
                              ${member.hourlyRate || 0}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                          <Link
                            href={`/shop/admin/employee/${member.id}`}
                            style={{
                              padding: '8px 16px',
                              background: 'rgba(59,130,246,0.2)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59,130,246,0.3)',
                              borderRadius: 6,
                              textDecoration: 'none',
                              fontSize: 13,
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            👤 View Profile
                          </Link>
                          <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                            Last active: {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Stats Summary */}
                <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ color: '#3b82f6', fontSize: 28, fontWeight: 700 }}>{teamData.length}</div>
                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Members</div>
                  </div>
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ color: '#22c55e', fontSize: 28, fontWeight: 700 }}>
                      {teamData.filter((m: any) => m.isClockedIn).length}
                    </div>
                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>Clocked In Now</div>
                  </div>
                  <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ color: '#8b5cf6', fontSize: 28, fontWeight: 700 }}>
                      {teamData.reduce((sum: number, m: any) => sum + m.weeklyHours, 0).toFixed(1)}
                    </div>
                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Hours This Week</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                    <div style={{ color: '#f59e0b', fontSize: 28, fontWeight: 700 }}>
                      {teamData.filter((m: any) => m.role === 'manager').length}
                    </div>
                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>Managers</div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div>
                {/* Header with Filter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ color: '#e5e7eb', fontSize: 24, margin: 0 }}>📦 Inventory Management</h2>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e5e7eb', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showLowStockOnly}
                      onChange={(e) => {
                        setShowLowStockOnly(e.target.checked);
                        fetchInventoryStock(shopId);
                      }}
                    />
                    Show Low Stock Only
                  </label>
                </div>

                {/* Purchase Orders */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: 0 }}>Purchase Orders</h3>
                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>{purchaseOrders.length} total</div>
                  </div>

                  {/* Creation card with banner */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(0,0,0,0.35)', marginBottom: 16, overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg,#22c55e,#16a34a)', color: 'white', padding: '10px 14px', fontWeight: 700, letterSpacing: 0.25 }}>
                      Create Purchase Order
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ color: '#9aa3b2', fontSize: 12 }}>Vendor (optional)</span>
                          <input
                            type="text"
                            value={poForm.vendor}
                            onChange={(e) => setPoForm({ ...poForm, vendor: e.target.value })}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ color: '#9aa3b2', fontSize: 12 }}>Item Name</span>
                          <input
                            type="text"
                            value={poForm.itemName}
                            onChange={(e) => setPoForm({ ...poForm, itemName: e.target.value })}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ color: '#9aa3b2', fontSize: 12 }}>Quantity</span>
                          <input
                            type="number"
                            min={1}
                            placeholder="Quantity"
                            value={poForm.quantity}
                            onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ color: '#9aa3b2', fontSize: 12 }}>Unit Cost</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Unit cost"
                            value={poForm.unitCost}
                            onChange={(e) => setPoForm({ ...poForm, unitCost: Number(e.target.value) })}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ color: '#9aa3b2', fontSize: 12 }}>Choose Work Order</span>
                          <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, background: 'rgba(0,0,0,0.35)', padding: 8 }}>
                            {loadingWorkOrders ? (
                              <div style={{ color: '#9aa3b2', fontSize: 12 }}>Loading...</div>
                            ) : workOrderOptions.length === 0 ? (
                              <div style={{ color: '#9aa3b2', fontSize: 12 }}>No work orders found</div>
                            ) : (
                              workOrderOptions.map((wo: any) => {
                                const label = `${wo.id} • ${wo.status} • ${wo.issueDescription?.symptoms || ''}`;
                                return (
                                  <div
                                    key={wo.id}
                                    onClick={() => {
                                      setPoForm({ ...poForm, workOrderId: wo.id });
                                      setWorkOrderSearch(wo.id);
                                    }}
                                    style={{ padding: '6px 8px', cursor: 'pointer', color: '#e5e7eb', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                  >
                                    {label}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleCreatePurchaseOrder}
                          style={{ padding: '10px 18px', background: '#22c55e', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Create PO
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List card with banner */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(0,0,0,0.35)', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg,#38bdf8,#6366f1)', color: 'white', padding: '10px 14px', fontWeight: 700, letterSpacing: 0.25 }}>
                      Existing Purchase Orders
                    </div>
                    <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                      {purchaseOrders.length === 0 ? (
                        <div style={{ color: '#9aa3b2', fontSize: 13 }}>No purchase orders yet.</div>
                      ) : (
                        purchaseOrders.map((po) => {
                          const bannerColor = po.status === 'received' ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#3b82f6,#1d4ed8)';
                          return (
                            <div key={po.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                              <div style={{ background: bannerColor, color: 'white', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                                <div>PO-{po.id.slice(-6)} {po.vendor ? `• ${po.vendor}` : ''}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                    {po.status.toUpperCase()}
                                  </span>
                                  {po.status !== 'received' && (
                                    <button
                                      onClick={() => handleReceivePurchaseOrder(po.id)}
                                      style={{ padding: '6px 12px', background: '#0ea5e9', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Mark Received
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div style={{ padding: 12 }}>
                                <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 6 }}>
                                  Vendor: {po.vendor || 'N/A'} • Items: {po.items?.length || 0} • Created: {new Date(po.createdAt).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'grid', gap: 6 }}>
                                  {po.items?.map((item: any) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: 13 }}>
                                      <span>{item.itemName} (x{item.quantity})</span>
                                      <span>${(item.unitCost || 0).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Pending Requests Section */}
                {inventoryRequests.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                    <h3 style={{ color: '#ef4444', fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⚠️</span>
                      Pending Inventory Requests ({inventoryRequests.length})
                    </h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {inventoryRequests.map((request: any) => (
                        <div key={request.id} style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 8,
                          padding: 16,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                              {request.itemName} (x{request.quantity})
                            </div>
                            <div style={{ color: '#9aa3b2', fontSize: 13 }}>
                              Requested by: {request.requesterName} • {request.reason || 'No reason provided'}
                            </div>
                            <div style={{ color: '#9aa3b2', fontSize: 12, marginTop: 4 }}>
                              Urgency: <span style={{ 
                                color: request.urgency === 'urgent' ? '#ef4444' : 
                                       request.urgency === 'high' ? '#f59e0b' : '#22c55e',
                                fontWeight: 600
                              }}>{request.urgency}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                await fetch('/api/shop/inventory-requests', {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    requestId: request.id,
                                    status: 'approved',
                                    approvedBy: localStorage.getItem('userId'),
                                  }),
                                });
                                fetchInventoryRequests(shopId);
                                fetchInventoryStock(shopId);
                              }}
                              style={{
                                padding: '8px 16px',
                                background: '#22c55e',
                                border: 'none',
                                borderRadius: 6,
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                await fetch('/api/shop/inventory-requests', {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    requestId: request.id,
                                    status: 'denied',
                                    approvedBy: localStorage.getItem('userId'),
                                  }),
                                });
                                fetchInventoryRequests(shopId);
                              }}
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(239,68,68,0.2)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 6,
                                color: '#ef4444',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              ✗ Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inventory Stock Table */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Item Name</th>
                          <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>SKU</th>
                          <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Category</th>
                          <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Quantity</th>
                          <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Reorder Point</th>
                          <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Unit Cost</th>
                          <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Location</th>
                          <th style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13, fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryStock.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9aa3b2' }}>
                              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                              <div>No inventory items found</div>
                              <div style={{ fontSize: 13, marginTop: 8 }}>Add items using the API or import from CSV</div>
                            </td>
                          </tr>
                        ) : (
                          inventoryStock.map((item: any) => {
                            const isLowStock = item.quantity <= item.reorderPoint;
                            return (
                              <tr key={item.id} style={{ 
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                background: isLowStock ? 'rgba(239,68,68,0.05)' : 'transparent'
                              }}>
                                <td style={{ padding: 16, color: '#e5e7eb', fontWeight: 600 }}>{item.itemName}</td>
                                <td style={{ padding: 16, color: '#9aa3b2', fontSize: 13 }}>{item.sku || '-'}</td>
                                <td style={{ padding: 16, color: '#9aa3b2', fontSize: 13 }}>{item.category || '-'}</td>
                                <td style={{ 
                                  padding: 16, 
                                  textAlign: 'center', 
                                  color: isLowStock ? '#ef4444' : '#e5e7eb',
                                  fontWeight: 700
                                }}>
                                  {item.quantity}
                                </td>
                                <td style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13 }}>
                                  {item.reorderPoint}
                                </td>
                                <td style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13 }}>
                                  ${item.unitCost?.toFixed(2) || '0.00'}
                                </td>
                                <td style={{ padding: 16, color: '#9aa3b2', fontSize: 13 }}>{item.location || '-'}</td>
                                <td style={{ padding: 16, textAlign: 'center' }}>
                                  {isLowStock ? (
                                    <span style={{
                                      padding: '4px 12px',
                                      background: 'rgba(239,68,68,0.2)',
                                      border: '1px solid rgba(239,68,68,0.3)',
                                      borderRadius: 12,
                                      color: '#ef4444',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      display: 'inline-block'
                                    }}>
                                      ⚠️ LOW STOCK
                                    </span>
                                  ) : (
                                    <span style={{
                                      padding: '4px 12px',
                                      background: 'rgba(34,197,94,0.2)',
                                      border: '1px solid rgba(34,197,94,0.3)',
                                      borderRadius: 12,
                                      color: '#22c55e',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      display: 'inline-block'
                                    }}>
                                      ✓ IN STOCK
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Inventory Button */}
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <div style={{ color: '#9aa3b2', fontSize: 13 }}>
                    To add new inventory items, use the <strong>POST /api/shop/inventory-stock</strong> endpoint or import from CSV
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

