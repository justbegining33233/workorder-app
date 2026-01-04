'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  status: string;
  priority: string;
  vehicleType: string;
  serviceLocation: string;
  customer: { firstName: string; lastName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

interface Tech {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  assignedWorkOrders: any[];
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'manager' && role !== 'shop') {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch work orders
      const woResponse = await fetch('/api/workorders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (woResponse.ok) {
        const woData = await woResponse.json();
        setWorkOrders(woData.filter((wo: WorkOrder) => 
          wo.status === 'pending' || wo.status === 'assigned' || wo.status === 'in-progress'
        ));
      }

      // Fetch techs
      const techResponse = await fetch('/api/techs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (techResponse.ok) {
        const techData = await techResponse.json();
        setTechs(techData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedWorkOrder || !selectedTech) {
      alert('Please select both a work order and a technician');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/manager/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          workOrderId: selectedWorkOrder,
          techId: selectedTech,
        }),
      });

      if (response.ok) {
        alert('Work order assigned successfully!');
        setSelectedWorkOrder(null);
        setSelectedTech('');
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign work order');
      }
    } catch (error) {
      console.error('Error assigning work order:', error);
      alert('Failed to assign work order');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e5e7eb', fontSize: 20 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(229,51,42,0.3)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Link href="/manager/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>👥 Assign Work Orders</h1>
          <p style={{ fontSize: 14, color: '#9aa3b2' }}>Distribute work to available technicians</p>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 400px', gap: 24 }}>
          {/* Unassigned Work Orders */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Work Orders</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  onClick={() => setSelectedWorkOrder(wo.id)}
                  style={{
                    background: selectedWorkOrder === wo.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                    border: selectedWorkOrder === wo.id ? '2px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                      WO-{wo.id.slice(0, 8)}
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: wo.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
                      color: wo.status === 'pending' ? '#f59e0b' : '#3b82f6'
                    }}>
                      {wo.status}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 4 }}>
                    Customer: {wo.customer?.firstName} {wo.customer?.lastName}
                  </div>
                  <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 4 }}>
                    Type: {wo.vehicleType} • {wo.serviceLocation}
                  </div>
                  {wo.assignedTo && (
                    <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                      ✓ Assigned to: {wo.assignedTo.firstName} {wo.assignedTo.lastName}
                    </div>
                  )}
                </div>
              ))}
              {workOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#9aa3b2' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                  <p>All work orders are assigned!</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Technicians */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Technicians</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
              {techs.map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTech(tech.id)}
                  style={{
                    background: selectedTech === tech.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                    border: selectedTech === tech.id ? '2px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                        {tech.firstName} {tech.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: '#9aa3b2' }}>{tech.role}</div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: (tech.assignedWorkOrders?.length || 0) > 3 ? 'rgba(229,51,42,0.2)' : 'rgba(16,185,129,0.2)',
                      color: (tech.assignedWorkOrders?.length || 0) > 3 ? '#e5332a' : '#10b981'
                    }}>
                      {tech.assignedWorkOrders?.length || 0} active
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9aa3b2' }}>
                    Workload: {tech.assignedWorkOrders?.length || 0} jobs
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Panel */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Assign Work</h2>
            
            {selectedWorkOrder && selectedTech ? (
              <div>
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, color: '#9aa3b2', marginBottom: 8 }}>Selected Work Order:</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>
                    WO-{selectedWorkOrder.slice(0, 8)}
                  </div>
                </div>

                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: '#9aa3b2', marginBottom: 8 }}>Assigned To:</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>
                    {techs.find(t => t.id === selectedTech)?.firstName} {techs.find(t => t.id === selectedTech)?.lastName}
                  </div>
                </div>

                <button
                  onClick={handleAssign}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginBottom: 12
                  }}
                >
                  Confirm Assignment
                </button>

                <button
                  onClick={() => {
                    setSelectedWorkOrder(null);
                    setSelectedTech('');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#9aa3b2',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa3b2' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👈</div>
                <p style={{ fontSize: 14 }}>Select a work order and a technician to assign</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
