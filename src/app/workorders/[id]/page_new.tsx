'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkOrder } from '@/types/workorder';

export default function WorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('customer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const r = localStorage.getItem('userRole') || 'customer';
      setRole(r);
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetchWorkOrder(p.id);
    });
  }, []);

  const fetchWorkOrder = async (workOrderId: string) => {
    try {
      const response = await fetch(`/api/workorders/${workOrderId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Work order not found');
      const data = await response.json();
      setWorkOrder(data);
    } catch (error) {
      console.error('Error fetching work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const res = await fetch(`/api/workorders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role, 'x-csrf-token': csrf || '' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchWorkOrder(id);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this work order?')) return;
    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch(`/api/workorders/${id}`, { method: 'DELETE', credentials: 'include', headers: { 'x-csrf-token': csrf || '' } });
      if (!response.ok) throw new Error('Failed to delete');
      router.push('/workorders/list');
    } catch (error) {
      console.error('Error deleting work order:', error);
      alert('Failed to delete work order');
    }
  };

  if (loading) {
    return (
      <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{color:'#e5e7eb', fontSize:18}}>Loading...</div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
        <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px'}}>
          <Link href="/workorders/list" style={{color:'#3b82f6', textDecoration:'none', fontSize:14}}>← Back to Work Orders</Link>
        </div>
        <div style={{textAlign:'center', paddingTop:80, color:'#9aa3b2'}}>Work order not found</div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    'pending': 'rgba(245,158,11,0.2)',
    'in-progress': 'rgba(59,130,246,0.2)',
    'waiting-for-payment': 'rgba(168,85,247,0.2)',
    'closed': 'rgba(34,197,94,0.2)',
    'denied-estimate': 'rgba(229,51,42,0.2)',
  };

  const statusTextColors: Record<string, string> = {
    'pending': '#f59e0b',
    'in-progress': '#3b82f6',
    'waiting-for-payment': '#a855f7',
    'closed': '#22c55e',
    'denied-estimate': '#e5332a',
  };

  const partsTotal = (workOrder.partLaborBreakdown?.partsUsed || []).reduce((sum, p) => sum + p.quantity * (p.unitPrice || 0), 0);
  const laborTotal = (workOrder.partLaborBreakdown?.laborLines || []).reduce((sum, l) => sum + l.hours * (l.ratePerHour || 0), 0);
  const additionalTotal = (workOrder.partLaborBreakdown?.additionalCharges || []).reduce((sum, c) => sum + c.amount, 0);
  const grandTotal = partsTotal + laborTotal + additionalTotal;

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/workorders/list" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, marginBottom:16, display:'inline-block'}}>← Back to Work Orders</Link>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16}}>
            <div>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Work Order: {workOrder.id}</h1>
              <div style={{fontSize:14, color:'#9aa3b2'}}>
                <span>Created: {new Date(workOrder.createdAt).toLocaleDateString()}</span>
                <span style={{margin:'0 8px'}}>•</span>
                <span>Customer: {workOrder.createdBy}</span>
                {workOrder.assignedTo && (
                  <>
                    <span style={{margin:'0 8px'}}>•</span>
                    <span>Assigned: {workOrder.assignedTo}</span>
                  </>
                )}
              </div>
            </div>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <span style={{padding:'8px 16px', background:statusColors[workOrder.status], color:statusTextColors[workOrder.status], borderRadius:8, fontSize:13, fontWeight:600}}>
                {workOrder.status.replace('-', ' ').toUpperCase()}
              </span>
              {['tech', 'manager'].includes(role) && (
                <button onClick={handleDelete} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        {/* Status Actions */}
        {['tech', 'manager'].includes(role) && (
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Status Actions</h2>
            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              {workOrder.status === 'pending' && (
                <button onClick={() => updateStatus('in-progress')} style={{padding:'12px 24px', background:'#22c55e', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}>
                  Start Work
                </button>
              )}
              {workOrder.status === 'in-progress' && (
                <button onClick={() => updateStatus('waiting-for-payment')} style={{padding:'12px 24px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}>
                  Complete Job
                </button>
              )}
              {workOrder.status === 'waiting-for-payment' && (
                <button onClick={() => updateStatus('closed')} style={{padding:'12px 24px', background:'#22c55e', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}>
                  Mark as Paid & Close
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24, marginBottom:24}}>
          {/* Main Info */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Issue Description</h2>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>Symptoms</div>
              <div style={{fontSize:15, color:'#e5e7eb'}}>{workOrder.issueDescription.symptoms}</div>
            </div>
            {workOrder.issueDescription.additionalNotes && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>Additional Notes</div>
                <div style={{fontSize:15, color:'#e5e7eb'}}>{workOrder.issueDescription.additionalNotes}</div>
              </div>
            )}

            <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginTop:24, marginBottom:12}}>Services</h3>
            {workOrder.services.repairs && workOrder.services.repairs.length > 0 && (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:13, color:'#9aa3b2', marginBottom:6}}>Repairs</div>
                {workOrder.services.repairs.map((repair, idx) => (
                  <div key={idx} style={{padding:'8px 12px', background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.2)', borderRadius:6, marginBottom:4, fontSize:14, color:'#e5e7eb'}}>
                    {repair.type.replace('-', ' ').toUpperCase()}
                    {repair.description && <span style={{color:'#9aa3b2'}}> - {repair.description}</span>}
                  </div>
                ))}
              </div>
            )}
            {workOrder.services.maintenance && workOrder.services.maintenance.length > 0 && (
              <div>
                <div style={{fontSize:13, color:'#9aa3b2', marginBottom:6}}>Maintenance</div>
                {workOrder.services.maintenance.map((maint, idx) => (
                  <div key={idx} style={{padding:'8px 12px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:6, marginBottom:4, fontSize:14, color:'#e5e7eb'}}>
                    {maint.type.replace('-', ' ').toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estimate & Cost Breakdown */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Cost Breakdown</h2>
            
            {workOrder.estimate && (
              <div style={{marginBottom:20, padding:16, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8}}>
                <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Estimate</div>
                <div style={{fontSize:24, fontWeight:700, color:'#22c55e'}}>${workOrder.estimate.amount}</div>
                {workOrder.estimate.details && (
                  <div style={{fontSize:12, color:'#b8beca', marginTop:4}}>{workOrder.estimate.details}</div>
                )}
                <div style={{fontSize:11, color:'#6b7280', marginTop:8}}>
                  Status: {workOrder.estimate.status || 'proposed'}
                </div>
              </div>
            )}

            {workOrder.partLaborBreakdown && (
              <>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Parts</div>
                  {(workOrder.partLaborBreakdown.partsUsed || []).map((part, idx) => (
                    <div key={idx} style={{display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13, color:'#e5e7eb'}}>
                      <span>{part.name} (x{part.quantity})</span>
                      <span style={{color:'#22c55e'}}>${(part.quantity * (part.unitPrice || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.1)', fontSize:14, fontWeight:600, color:'#e5e7eb'}}>
                    <span>Parts Total</span>
                    <span style={{color:'#22c55e'}}>${partsTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{marginBottom:12}}>
                  <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Labor</div>
                  {(workOrder.partLaborBreakdown.laborLines || []).map((labor, idx) => (
                    <div key={idx} style={{marginBottom:6}}>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:13, color:'#e5e7eb'}}>
                        <span>{labor.description}</span>
                        <span style={{color:'#3b82f6'}}>${(labor.hours * (labor.ratePerHour || 0)).toFixed(2)}</span>
                      </div>
                      <div style={{fontSize:11, color:'#6b7280'}}>{labor.hours}h @ ${labor.ratePerHour}/hr</div>
                    </div>
                  ))}
                  <div style={{display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.1)', fontSize:14, fontWeight:600, color:'#e5e7eb'}}>
                    <span>Labor Total</span>
                    <span style={{color:'#3b82f6'}}>${laborTotal.toFixed(2)}</span>
                  </div>
                </div>

                {(workOrder.partLaborBreakdown.additionalCharges || []).length > 0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Additional</div>
                    {(workOrder.partLaborBreakdown.additionalCharges || []).map((charge, idx) => (
                      <div key={idx} style={{display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13, color:'#e5e7eb'}}>
                        <span>{charge.description}</span>
                        <span style={{color:'#f59e0b'}}>${charge.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'2px solid rgba(229,51,42,0.3)', fontSize:18, fontWeight:700, color:'#e5e7eb'}}>
                  <span>Grand Total</span>
                  <span style={{color:'#e5332a'}}>${grandTotal.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Messages</h2>
          {workOrder.messages && workOrder.messages.length > 0 ? (
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {workOrder.messages.map((msg) => (
                <div key={msg.id} style={{padding:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                    <span style={{fontSize:14, fontWeight:600, color:'#e5e7eb'}}>{msg.senderName}</span>
                    <span style={{fontSize:12, color:'#6b7280'}}>{new Date(msg.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{fontSize:14, color:'#b8beca'}}>{msg.body}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{fontSize:14, color:'#6b7280', textAlign:'center', padding:20}}>No messages yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
