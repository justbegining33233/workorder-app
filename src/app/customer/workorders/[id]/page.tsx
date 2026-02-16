'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';
import TechLiveMap from '@/components/TechLiveMap';

interface WorkOrderDetails {
  id: string;
  issueDescription: string;
  status: string;
  serviceType: string;
  serviceLocation?: string | null;
  scheduledDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
  shop: {
    shopName: string;
    phone: string;
    address: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  tracking?: {
    latitude: number;
    longitude: number;
    estimatedArrival: string;
  };
}

export default function WorkOrderDetailsPage() {
  useRequireAuth(['customer']);
  const params = useParams();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [workOrder, setWorkOrder] = useState<WorkOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const workOrderId = params?.id as string;

  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    setUserName(name);
  }, []);

  useEffect(() => {
    if (workOrderId) {
      fetchWorkOrderDetails();
    }
  }, [workOrderId]);

  const fetchWorkOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/workorders/${workOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkOrder(data);
      } else {
        setError('Failed to load work order details');
      }
    } catch (err) {
      setError('Failed to load work order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Work Order Details</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:800, margin:'0 auto', padding:32}}>
        <div style={{marginBottom:24}}>
          <Link href="/customer/tracking" style={{
            color:'#3b82f6',
            textDecoration:'none',
            fontSize:14,
            display:'inline-flex',
            alignItems:'center',
            gap:8
          }}>
            ← Back to Tracking
          </Link>
        </div>

        {loading && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            Loading work order details...
          </div>
        )}

        {error && (
          <div style={{textAlign:'center', padding:40, color:'#ef4444'}}>
            {error}
          </div>
        )}

        {workOrder && (
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:32}}>
            <div style={{marginBottom:32}}>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>
                Work Order #{workOrder.id.slice(-8)}
              </h1>
              <div style={{
                display:'inline-block',
                padding:'4px 12px',
                background:getStatusColor(workOrder.status),
                color:'white',
                borderRadius:20,
                fontSize:12,
                fontWeight:600,
                textTransform:'uppercase'
              }}>
                {workOrder.status.replace('-', ' ')}
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:32}}>
              <div>
                <h3 style={{fontSize:18, fontWeight:600, color:'#e5e7eb', marginBottom:16}}>Service Details</h3>
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  <div>
                    <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Issue Description</div>
                    <div style={{color:'#e5e7eb'}}>{workOrder.issueDescription}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Service Type</div>
                    <div style={{color:'#e5e7eb'}}>{workOrder.serviceType}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Scheduled Date</div>
                    <div style={{color:'#e5e7eb'}}>{workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleString() : (workOrder.dueDate ? new Date(workOrder.dueDate).toLocaleString() : new Date(workOrder.createdAt).toLocaleString())}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Created</div>
                    <div style={{color:'#e5e7eb'}}>{new Date(workOrder.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{fontSize:18, fontWeight:600, color:'#e5e7eb', marginBottom:16}}>Shop & Technician</h3>
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  <div>
                    <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Shop</div>
                    <div style={{color:'#e5e7eb', fontWeight:500}}>{workOrder.shop.shopName}</div>
                    <div style={{fontSize:14, color:'#9aa3b2'}}>{workOrder.shop.address}</div>
                    <div style={{fontSize:14, color:'#9aa3b2'}}>{workOrder.shop.phone}</div>
                  </div>

                  {workOrder.assignedTo && (
                    <div>
                      <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Technician</div>
                      <div style={{color:'#e5e7eb', fontWeight:500}}>
                        {workOrder.assignedTo.firstName} {workOrder.assignedTo.lastName}
                      </div>
                      <div style={{fontSize:14, color:'#9aa3b2'}}>{workOrder.assignedTo.phone}</div>
                    </div>
                  )}

                  {workOrder.vehicle && (
                    <div>
                      <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Vehicle</div>
                      <div style={{color:'#e5e7eb', fontWeight:500}}>
                        {workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}
                      </div>
                      <div style={{fontSize:14, color:'#9aa3b2'}}>{workOrder.vehicle.licensePlate}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Info / Live Tracking - show shop address & appointment for in-shop jobs; show live GPS for roadside */}
            <div style={{marginTop:32, padding:20, background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.08)', borderRadius:8}}>
              <h3 style={{fontSize:16, fontWeight:600, color:'#3b82f6', marginBottom:12}}>{workOrder.serviceLocation && workOrder.serviceLocation.toLowerCase() !== 'roadside' ? 'Appointment Details' : 'Live Tracking'}</h3>

              {workOrder.serviceLocation && workOrder.serviceLocation.toLowerCase() !== 'roadside' ? (
                // IN-SHOP: Always show shop address and appointment time (do not show GPS)
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  <div style={{fontSize:14, color:'#e5e7eb'}}>🏬 Shop: <strong>{workOrder.shop.shopName}</strong></div>
                  <div style={{fontSize:14, color:'#9aa3b2'}}>{workOrder.shop.address}</div>
                  {workOrder.scheduledDate && <div style={{fontSize:14, color:'#f59e0b'}}>🕒 Appointment: {new Date(workOrder.scheduledDate).toLocaleString()}</div>}
                  {workOrder.dueDate && <div style={{fontSize:14, color:'#f59e0b'}}>🕒 Due: {new Date(workOrder.dueDate).toLocaleString()}</div>}
                </div>
              ) : (
                // ROADSIDE: show live map and latest tracking data when available
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  <div style={{width:'100%'}}>
                    <TechLiveMap workOrderId={workOrder.id} initialLocation={workOrder.tracking ?? null} techName={workOrder.assignedTo ? `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}` : undefined} />
                  </div>

                  {workOrder.tracking ? (
                    <div style={{display:'flex', gap:16, alignItems:'center'}}>
                      <div style={{fontSize:14, color:'#e5e7eb'}}>📍 Current Location: {workOrder.tracking.latitude.toFixed(4)}, {workOrder.tracking.longitude.toFixed(4)}</div>
                      {workOrder.tracking.estimatedArrival && <div style={{fontSize:14, color:'#f59e0b'}}>⏰ ETA: {new Date(workOrder.tracking.estimatedArrival).toLocaleTimeString()}</div>}
                    </div>
                  ) : (
                    <div style={{fontSize:14, color:'#9aa3b2'}}>Live tracking not available for this job yet.</div>
                  )}
                </div>
              )}

            </div>

            <div style={{marginTop:32, display:'flex', gap:12}}>
              <Link href="/customer/tracking" style={{
                flex:1,
                padding:'12px',
                background:'#6b7280',
                color:'white',
                border:'none',
                borderRadius:8,
                fontSize:14,
                fontWeight:600,
                textDecoration:'none',
                textAlign:'center'
              }}>
                Back to Tracking
              </Link>
              {workOrder.assignedTo?.phone && (
                <a href={`tel:${workOrder.assignedTo.phone}`} style={{
                  flex:1,
                  padding:'12px',
                  background:'rgba(34,197,94,0.1)',
                  color:'#22c55e',
                  border:'1px solid rgba(34,197,94,0.3)',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  textDecoration:'none',
                  textAlign:'center'
                }}>
                  Call Technician
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}