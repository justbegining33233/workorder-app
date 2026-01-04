'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/sos-theme.css';
import { getAllWorkOrdersClient } from '@/lib/workordersClient';

interface WorkOrder {
  id: string;
  customerName?: string;
  createdBy?: string;
  vehicleType?: string;
  status: string;
  serviceType?: string;
  createdAt: Date | string;
  assignedTo?: string;
}

function WorkOrderListPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get('filter');
  const status = searchParams.get('status');

  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) setUserRole(role);
  }, []);

  const getDashboardLink = () => {
    switch (userRole) {
      case 'superadmin': return '/admin/home';
      case 'shop': return '/shop/home';
      case 'tech': return '/tech/home';
      case 'manager': return '/tech/home';
      case 'customer': return '/customer/home';
      default: return '/dashboard';
    }
  };

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    // Load work orders from localStorage
    const orders = getAllWorkOrdersClient();
    setWorkOrders(orders);
  }, []);

  useEffect(() => {
    let filtered = [...workOrders];

    if (status) {
      filtered = filtered.filter(wo => wo.status === status);
    }

    setFilteredOrders(filtered);
  }, [status, workOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#9aa3b2';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="sos-wrap">
      <div className="sos-card" style={{ maxWidth: 1400 }}>
        <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px', borderRadius:'16px 16px 0 0'}}>
          <Link href="/shop/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Shop Dashboard
          </Link>
        </div>
        <div className="sos-header">
          <div className="sos-brand">
            <span className="mark">SOS</span>
            <span className="sub">Work Orders</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/workorders/new" className="btn-primary">+ Roadside</Link>
            <Link href="/workorders/inshop" className="btn-primary" style={{background:'linear-gradient(to right, #059669, #047857)'}}>+ In-Shop</Link>
          </div>
        </div>

        <div className="sos-pane" style={{ padding: 28 }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #2d2d2d', paddingBottom: 12 }}>
            <Link href="/workorders/list">
              <button className={!status ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 14 }}>
                All Orders ({workOrders.length})
              </button>
            </Link>
            <Link href="/workorders/list?status=pending">
              <button className={status === 'pending' ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 14 }}>
                Pending ({workOrders.filter(w => w.status === 'pending').length})
              </button>
            </Link>
            <Link href="/workorders/list?status=in-progress">
              <button className={status === 'in-progress' ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 14 }}>
                In Progress ({workOrders.filter(w => w.status === 'in-progress').length})
              </button>
            </Link>
            <Link href="/workorders/list?status=completed">
              <button className={status === 'completed' ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 14 }}>
                Completed ({workOrders.filter(w => w.status === 'completed').length})
              </button>
            </Link>
          </div>

          {/* Work Orders Table */}
          <div style={{ overflowX: 'auto' }}>
            {/* Table Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(150px, 1.5fr) minmax(150px, 2fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(120px, 1fr) minmax(90px, 1fr)', gap: '20px', padding: '12px 20px', borderBottom: '1px solid #2d2d2d', marginBottom: '12px', minWidth: '1100px' }}>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</div>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</div>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle</div>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</div>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned To</div>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</div>
              <div style={{ color: '#9aa3b2', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</div>
            </div>

            {/* Work Orders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '1100px' }}>
              {filteredOrders.map((order) => {
                const customerName = order.customerName || order.createdBy || 'Unknown';
                const vehicleInfo = order.vehicleType || 'N/A';
                const serviceType = order.serviceType || 'roadside';
                
                return (
                <div key={order.id} className="sos-item" style={{ 
                  background: 'rgba(61, 61, 61, 0.6)', 
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(100px, 1fr) minmax(150px, 1.5fr) minmax(150px, 2fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(120px, 1fr) minmax(90px, 1fr)', 
                  gap: '20px', 
                  padding: '18px 20px', 
                  alignItems: 'center',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ fontWeight: 700, color: '#ff7a59', fontSize: '14px' }}>{order.id}</div>
                  <div style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 500 }}>{customerName}</div>
                  <div style={{ color: '#9aa3b2', fontSize: '13px' }}>{vehicleInfo}</div>
                  <div>
                    <span style={{ 
                      padding: '6px 14px', 
                      borderRadius: 16, 
                      fontSize: 11, 
                      fontWeight: 700,
                      background: serviceType === 'roadside' ? 'linear-gradient(135deg, #1e40af, #1e3a8a)' : 'linear-gradient(135deg, #047857, #065f46)',
                      color: 'white',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {serviceType === 'roadside' ? '🚗 Roadside' : '🏢 In-Shop'}
                    </span>
                  </div>
                  <div>
                    <span style={{ 
                      padding: '6px 14px', 
                      borderRadius: 16, 
                      fontSize: 11, 
                      fontWeight: 700,
                      background: getStatusColor(order.status),
                      color: 'white',
                      display: 'inline-block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div style={{ color: '#9aa3b2', fontSize: '13px' }}>{order.assignedTo || <span style={{fontStyle: 'italic', color: '#6b7280'}}>Unassigned</span>}</div>
                  <div style={{ color: '#9aa3b2', fontSize: '12px' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <Link href={`/workorders/${order.id}`}>
                      <button className="btn-outline" style={{ fontSize: 12, padding: '8px 18px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        View
                      </button>
                    </Link>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {filteredOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9aa3b2' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Work Orders Found</div>
              <div style={{ fontSize: 14 }}>
                {status ? `No ${getStatusLabel(status).toLowerCase()} work orders at this time.` : 'Create a new work order to get started.'}
              </div>
            </div>
          )}
        </div>

        <div className="sos-footer">
          <span className="sos-tagline">© {new Date().getFullYear()} SOS • Service Order System</span>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrderListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkOrderListPageContent />
    </Suspense>
  );
}
