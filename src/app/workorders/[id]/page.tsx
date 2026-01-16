'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkOrder, Message } from '@/types/workorder';
import { getWorkOrderByIdClient, updateWorkOrderClient, deleteWorkOrderClient } from '@/lib/workordersClient';

type Part = { name: string; quantity: number; unitPrice: number };
type Labor = { description: string; hours: number; ratePerHour: number };
type AdditionalCharge = { description: string; amount: number };
type Photo = { url: string; type: string; caption?: string; timestamp: Date };

export default function WorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('customer');
  const [userName, setUserName] = useState<string>('User');
  
  // Parts/Labor state
  const [newPart, setNewPart] = useState<Part>({ name: '', quantity: 1, unitPrice: 0 });
  const [newLabor, setNewLabor] = useState<Labor>({ description: '', hours: 0, ratePerHour: 0 });
  const [newCharge, setNewCharge] = useState<AdditionalCharge>({ description: '', amount: 0 });
  
  // Estimate state
  const [estimateAmount, setEstimateAmount] = useState('');
  const [estimateDetails, setEstimateDetails] = useState('');
  
  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Photo state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoType, setPhotoType] = useState('before');
  const [photoCaption, setPhotoCaption] = useState('');
  
  // Messaging state
  const [messageBody, setMessageBody] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // UI state
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const r = localStorage.getItem('userRole') || 'customer';
      const n = localStorage.getItem('userName') || 'User';
      setRole(r);
      setUserName(n);
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetchWorkOrder(p.id);
    });
  }, []);

  useEffect(() => {
    if (workOrder?.messages) {
      setMessages([...workOrder.messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    }
  }, [workOrder]);

  const fetchWorkOrder = async (workOrderId: string) => {
    try {
      const wo = getWorkOrderByIdClient(workOrderId);
      if (!wo) {
        setError('Work order not found');
        return;
      }
      setWorkOrder(wo);
      setError(null);
    } catch (error) {
      console.error('Error fetching work order:', error);
      setError(error instanceof Error ? error.message : 'Failed to load work order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    try {
      const updated = updateWorkOrderClient(id, { status: newStatus as WorkOrder['status'] });
      if (updated) {
        setWorkOrder(updated);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  const updateWorkOrder = async (updates: Partial<WorkOrder>) => {
    if (!id) return;
    try {
      const updated = updateWorkOrderClient(id, updates);
      if (updated) {
        setWorkOrder(updated);
      }
    } catch (error) {
      console.error('Error updating work order:', error);
    }
  };
  
  // Parts/Labor handlers
  const addPart = () => {
    if (!newPart.name || newPart.quantity <= 0 || newPart.unitPrice <= 0) return;
    const currentParts = workOrder?.partLaborBreakdown?.partsUsed || [];
    updateWorkOrder({
      partLaborBreakdown: {
        ...workOrder?.partLaborBreakdown,
        laborLines: workOrder?.partLaborBreakdown?.laborLines || [],
        partsUsed: [...currentParts, newPart],
      }
    });
    setNewPart({ name: '', quantity: 1, unitPrice: 0 });
  };
  
  const removePart = (index: number) => {
    const currentParts = workOrder?.partLaborBreakdown?.partsUsed || [];
    updateWorkOrder({
      partLaborBreakdown: {
        ...workOrder?.partLaborBreakdown,
        laborLines: workOrder?.partLaborBreakdown?.laborLines || [],
        partsUsed: currentParts.filter((_, i) => i !== index),
      }
    });
  };
  
  const addLabor = () => {
    if (!newLabor.description || newLabor.hours <= 0 || newLabor.ratePerHour <= 0) return;
    const currentLabor = workOrder?.partLaborBreakdown?.laborLines || [];
    updateWorkOrder({
      partLaborBreakdown: {
        ...workOrder?.partLaborBreakdown,
        partsUsed: workOrder?.partLaborBreakdown?.partsUsed || [],
        laborLines: [...currentLabor, newLabor],
      }
    });
    setNewLabor({ description: '', hours: 0, ratePerHour: 0 });
  };
  
  const removeLabor = (index: number) => {
    const currentLabor = workOrder?.partLaborBreakdown?.laborLines || [];
    updateWorkOrder({
      partLaborBreakdown: {
        ...workOrder?.partLaborBreakdown,
        partsUsed: workOrder?.partLaborBreakdown?.partsUsed || [],
        laborLines: currentLabor.filter((_, i) => i !== index),
      }
    });
  };
  
  const addAdditionalCharge = () => {
    if (!newCharge.description || newCharge.amount <= 0) return;
    const currentCharges = workOrder?.partLaborBreakdown?.additionalCharges || [];
    updateWorkOrder({
      partLaborBreakdown: {
        ...workOrder?.partLaborBreakdown,
        partsUsed: workOrder?.partLaborBreakdown?.partsUsed || [],
        additionalCharges: [...currentCharges, newCharge],
      }
    });
    setNewCharge({ description: '', amount: 0 });
  };
  
  const removeCharge = (index: number) => {
    const currentCharges = workOrder?.partLaborBreakdown?.additionalCharges || [];
    updateWorkOrder({
      partLaborBreakdown: {
        ...workOrder?.partLaborBreakdown,
        partsUsed: workOrder?.partLaborBreakdown?.partsUsed || [],
        additionalCharges: currentCharges.filter((_, i) => i !== index),
      }
    });
  };
  
  // Estimate handlers
  const submitEstimate = () => {
    const amount = parseFloat(estimateAmount);
    if (!estimateAmount || isNaN(amount) || amount <= 0) return;
    updateWorkOrder({
      estimate: {
        amount,
        details: estimateDetails,
        status: 'proposed',
      }
    });
    setShowEstimateForm(false);
    setEstimateAmount('');
    setEstimateDetails('');
  };
  
  const acceptEstimate = () => {
    updateWorkOrder({
      estimate: {
        ...workOrder?.estimate,
        amount: workOrder?.estimate?.amount || 0,
        status: 'accepted',
      }
    });
    setShowScheduleForm(true);
  };
  
  const rejectEstimate = () => {
    updateWorkOrder({
      estimate: {
        ...workOrder?.estimate,
        amount: workOrder?.estimate?.amount || 0,
        status: 'rejected',
      },
      status: 'denied-estimate',
    });
  };
  
  // Scheduling handler
  const submitSchedule = () => {
    if (!scheduledDate || !scheduledTime) return;
    updateWorkOrder({
      scheduledDate: new Date(`${scheduledDate}T${scheduledTime}`),
      status: 'in-progress',
    });
    setShowScheduleForm(false);
    setScheduledDate('');
    setScheduledTime('');
  };
  
  // Payment handler
  const submitPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) return;
    const currentPayments = workOrder?.payments || [];
    updateWorkOrder({
      payments: [
        ...currentPayments,
        {
          amount,
          method: paymentMethod as 'cash' | 'check' | 'card' | 'ach' | 'other',
          notes: paymentNotes,
          timestamp: new Date(),
        }
      ],
      status: 'closed',
    });
    setShowPaymentForm(false);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
  };
  
  // Photo handler
  const addPhoto = () => {
    if (!photoUrl) return;
    const currentPhotos = workOrder?.photos || [];
    updateWorkOrder({
      photos: [
        ...currentPhotos,
        {
          url: photoUrl,
          type: photoType,
          caption: photoCaption,
          timestamp: new Date(),
        }
      ]
    });
    setShowPhotoForm(false);
    setPhotoUrl('');
    setPhotoType('before');
    setPhotoCaption('');
  };
  
  // Messaging handler
  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageBody.trim() || !id) return;
    setSendingMessage(true);
    
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: role as any,
      senderName: userName,
      body: messageBody.trim(),
      timestamp: new Date(),
    };
    
    // Optimistic UI
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setMessageBody('');
    
    try {
      const updated = updateWorkOrderClient(id, { messages: updatedMessages });
      if (updated) {
        setWorkOrder(updated);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this work order?')) return;
    try {
      const deleted = deleteWorkOrderClient(id);
      if (deleted) {
        router.push('/workorders/list');
      } else {
        throw new Error('Failed to delete');
      }
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

  if (error || !workOrder) {
    return (
      <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
        <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px'}}>
          <Link href="/workorders/list" style={{color:'#3b82f6', textDecoration:'none', fontSize:14}}>← Back to Work Orders</Link>
        </div>
        <div style={{textAlign:'center', paddingTop:80}}>
          <div style={{color:'#e5332a', fontSize:24, fontWeight:600, marginBottom:16}}>⚠️ {error || 'Work order not found'}</div>
          <p style={{color:'#9aa3b2', marginBottom:24}}>The work order you're looking for doesn't exist or has been removed.</p>
          <Link href="/workorders/list" style={{display:'inline-block', padding:'12px 24px', background:'#3b82f6', color:'white', textDecoration:'none', borderRadius:8, fontWeight:600}}>
            View All Work Orders
          </Link>
        </div>
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
            
            {/* Photos Section */}
            {['tech', 'manager'].includes(role) && (
              <div style={{marginTop:24}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                  <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>Photos</h3>
                  <button 
                    onClick={() => setShowPhotoForm(!showPhotoForm)}
                    style={{padding:'6px 12px', background:'#3b82f6', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600}}
                  >
                    {showPhotoForm ? 'Cancel' : '+ Add Photo'}
                  </button>
                </div>
                
                {showPhotoForm && (
                  <div style={{padding:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, marginBottom:12}}>
                    <input
                      type="text"
                      placeholder="Photo URL"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                    />
                    <select
                      value={photoType}
                      onChange={(e) => setPhotoType(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                    >
                      <option value="before">Before</option>
                      <option value="after">After</option>
                      <option value="progress">In Progress</option>
                      <option value="documentation">Documentation</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                    />
                    <button
                      onClick={addPhoto}
                      style={{width:'100%', padding:'10px', background:'#22c55e', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:600}}
                    >
                      Upload Photo
                    </button>
                  </div>
                )}
                
                {workOrder.photos && workOrder.photos.length > 0 ? (
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12}}>
                    {workOrder.photos.map((photo, idx) => (
                      <div key={idx} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:8}}>
                        <img src={photo.url} alt={photo.caption || photo.type} style={{width:'100%', height:120, objectFit:'cover', borderRadius:6, marginBottom:8}} />
                        <div style={{fontSize:11, color:'#9aa3b2', textTransform:'uppercase', marginBottom:4}}>{photo.type}</div>
                        {photo.caption && <div style={{fontSize:12, color:'#e5e7eb'}}>{photo.caption}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{fontSize:14, color:'#6b7280', textAlign:'center', padding:20}}>No photos uploaded</div>
                )}
              </div>
            )}
          </div>

          {/* Estimate & Cost Breakdown */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Cost Breakdown</h2>
            
            {/* Estimate Section */}
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
                
                {/* Customer estimate actions */}
                {role === 'customer' && workOrder.estimate.status === 'proposed' && (
                  <div style={{display:'flex', gap:8, marginTop:12}}>
                    <button
                      onClick={acceptEstimate}
                      style={{flex:1, padding:'8px', background:'#22c55e', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600}}
                    >
                      Accept
                    </button>
                    <button
                      onClick={rejectEstimate}
                      style={{flex:1, padding:'8px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600}}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Estimate Form for Tech/Manager */}
            {['tech', 'manager'].includes(role) && !workOrder.estimate && (
              <div style={{marginBottom:20}}>
                <div style={{display:'flex', gap:8, marginBottom:8}}>
                  <button
                    onClick={() => setShowEstimateForm(true)}
                    style={{flex:1, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}
                  >
                    Quick Estimate
                  </button>
                  <Link
                    href={`/manager/estimates?workOrderId=${id}`}
                    style={{flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600, textDecoration:'none', textAlign:'center'}}
                  >
                    Detailed Estimate
                  </Link>
                </div>
                {showEstimateForm && (
                  <div style={{padding:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8}}>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={estimateAmount}
                      onChange={(e) => setEstimateAmount(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                    />
                    <textarea
                      placeholder="Details (optional)"
                      value={estimateDetails}
                      onChange={(e) => setEstimateDetails(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8, minHeight:60, resize:'vertical'}}
                    />
                    <div style={{display:'flex', gap:8}}>
                      <button
                        onClick={submitEstimate}
                        style={{flex:1, padding:'8px', background:'#22c55e', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setShowEstimateForm(false)}
                        style={{flex:1, padding:'8px', background:'#6b7280', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Schedule Form */}
            {showScheduleForm && (
              <div style={{marginBottom:20, padding:16, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8}}>
                <h3 style={{fontSize:16, fontWeight:700, color:'#e5e7eb', marginBottom:12}}>Schedule Appointment</h3>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                />
                <button
                  onClick={submitSchedule}
                  style={{width:'100%', padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:600}}
                >
                  Confirm Schedule
                </button>
              </div>
            )}

            {workOrder.partLaborBreakdown && (
              <>
                {/* Parts Section */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <div style={{fontSize:13, color:'#9aa3b2'}}>Parts</div>
                    {['tech', 'manager'].includes(role) && (
                      <button
                        onClick={() => {
                          const show = document.getElementById('addPartForm')?.style.display === 'none';
                          const elem = document.getElementById('addPartForm');
                          if (elem) elem.style.display = show ? 'block' : 'none';
                        }}
                        style={{padding:'4px 8px', background:'#3b82f6', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:600}}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  
                  {/* Add Part Form */}
                  {['tech', 'manager'].includes(role) && (
                    <div id="addPartForm" style={{display:'none', padding:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, marginBottom:8}}>
                      <input
                        type="text"
                        placeholder="Part name"
                        value={newPart.name}
                        onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                        style={{width:'100%', padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12, marginBottom:6}}
                      />
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6}}>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={newPart.quantity}
                          onChange={(e) => setNewPart({...newPart, quantity: parseFloat(e.target.value) || 0})}
                          style={{padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12}}
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={newPart.unitPrice}
                          onChange={(e) => setNewPart({...newPart, unitPrice: parseFloat(e.target.value) || 0})}
                          style={{padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12}}
                        />
                      </div>
                      <button
                        onClick={addPart}
                        style={{width:'100%', padding:'6px', background:'#22c55e', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600}}
                      >
                        Add Part
                      </button>
                    </div>
                  )}
                  
                  {(workOrder.partLaborBreakdown.partsUsed || []).map((part, idx) => (
                    <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, fontSize:13, color:'#e5e7eb'}}>
                      <span>{part.name} (x{part.quantity})</span>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span style={{color:'#22c55e'}}>${(part.quantity * (part.unitPrice || 0)).toFixed(2)}</span>
                        {['tech', 'manager'].includes(role) && (
                          <button
                            onClick={() => removePart(idx)}
                            style={{padding:'2px 6px', background:'#e5332a', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:10}}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.1)', fontSize:14, fontWeight:600, color:'#e5e7eb'}}>
                    <span>Parts Total</span>
                    <span style={{color:'#22c55e'}}>${partsTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Labor Section */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <div style={{fontSize:13, color:'#9aa3b2'}}>Labor</div>
                    {['tech', 'manager'].includes(role) && (
                      <button
                        onClick={() => {
                          const show = document.getElementById('addLaborForm')?.style.display === 'none';
                          const elem = document.getElementById('addLaborForm');
                          if (elem) elem.style.display = show ? 'block' : 'none';
                        }}
                        style={{padding:'4px 8px', background:'#3b82f6', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:600}}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  
                  {/* Add Labor Form */}
                  {['tech', 'manager'].includes(role) && (
                    <div id="addLaborForm" style={{display:'none', padding:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, marginBottom:8}}>
                      <input
                        type="text"
                        placeholder="Description"
                        value={newLabor.description}
                        onChange={(e) => setNewLabor({...newLabor, description: e.target.value})}
                        style={{width:'100%', padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12, marginBottom:6}}
                      />
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6}}>
                        <input
                          type="number"
                          placeholder="Hours"
                          value={newLabor.hours}
                          onChange={(e) => setNewLabor({...newLabor, hours: parseFloat(e.target.value) || 0})}
                          style={{padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12}}
                        />
                        <input
                          type="number"
                          placeholder="Rate/hr"
                          value={newLabor.ratePerHour}
                          onChange={(e) => setNewLabor({...newLabor, ratePerHour: parseFloat(e.target.value) || 0})}
                          style={{padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12}}
                        />
                      </div>
                      <button
                        onClick={addLabor}
                        style={{width:'100%', padding:'6px', background:'#22c55e', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600}}
                      >
                        Add Labor
                      </button>
                    </div>
                  )}
                  
                  {(workOrder.partLaborBreakdown.laborLines || []).map((labor, idx) => (
                    <div key={idx} style={{marginBottom:6}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:'#e5e7eb'}}>
                        <span>{labor.description}</span>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{color:'#3b82f6'}}>${(labor.hours * (labor.ratePerHour || 0)).toFixed(2)}</span>
                          {['tech', 'manager'].includes(role) && (
                            <button
                              onClick={() => removeLabor(idx)}
                              style={{padding:'2px 6px', background:'#e5332a', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:10}}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{fontSize:11, color:'#6b7280'}}>{labor.hours}h @ ${labor.ratePerHour}/hr</div>
                    </div>
                  ))}
                  <div style={{display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.1)', fontSize:14, fontWeight:600, color:'#e5e7eb'}}>
                    <span>Labor Total</span>
                    <span style={{color:'#3b82f6'}}>${laborTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Additional Charges Section */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <div style={{fontSize:13, color:'#9aa3b2'}}>Additional</div>
                    {['tech', 'manager'].includes(role) && (
                      <button
                        onClick={() => {
                          const show = document.getElementById('addChargeForm')?.style.display === 'none';
                          const elem = document.getElementById('addChargeForm');
                          if (elem) elem.style.display = show ? 'block' : 'none';
                        }}
                        style={{padding:'4px 8px', background:'#3b82f6', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:600}}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  
                  {/* Add Charge Form */}
                  {['tech', 'manager'].includes(role) && (
                    <div id="addChargeForm" style={{display:'none', padding:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, marginBottom:8}}>
                      <input
                        type="text"
                        placeholder="Description"
                        value={newCharge.description}
                        onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
                        style={{width:'100%', padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12, marginBottom:6}}
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={newCharge.amount}
                        onChange={(e) => setNewCharge({...newCharge, amount: parseFloat(e.target.value) || 0})}
                        style={{width:'100%', padding:'6px 8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:4, color:'#e5e7eb', fontSize:12, marginBottom:6}}
                      />
                      <button
                        onClick={addAdditionalCharge}
                        style={{width:'100%', padding:'6px', background:'#22c55e', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600}}
                      >
                        Add Charge
                      </button>
                    </div>
                  )}
                  
                  {(workOrder.partLaborBreakdown.additionalCharges || []).map((charge, idx) => (
                    <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, fontSize:13, color:'#e5e7eb'}}>
                      <span>{charge.description}</span>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span style={{color:'#f59e0b'}}>${charge.amount.toFixed(2)}</span>
                        {['tech', 'manager'].includes(role) && (
                          <button
                            onClick={() => removeCharge(idx)}
                            style={{padding:'2px 6px', background:'#e5332a', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:10}}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'2px solid rgba(229,51,42,0.3)', fontSize:18, fontWeight:700, color:'#e5e7eb'}}>
                  <span>Grand Total</span>
                  <span style={{color:'#e5332a'}}>${grandTotal.toFixed(2)}</span>
                </div>
              </>
            )}
            
            {/* Invoice Button */}
            {['tech', 'manager'].includes(role) && workOrder.status === 'waiting-for-payment' && (
              <div style={{marginTop:20}}>
                <button
                  onClick={() => setShowInvoice(!showInvoice)}
                  style={{width:'100%', padding:'12px', background:'#a855f7', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}
                >
                  {showInvoice ? 'Hide Invoice' : 'Generate Invoice'}
                </button>
                {showInvoice && (
                  <div style={{marginTop:12, padding:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8}}>
                    <div style={{textAlign:'center', marginBottom:16}}>
                      <h3 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>INVOICE</h3>
                      <div style={{fontSize:12, color:'#9aa3b2'}}>Work Order: {workOrder.id}</div>
                    </div>
                    <div style={{fontSize:13, color:'#e5e7eb', marginBottom:12}}>
                      <div style={{marginBottom:4}}><strong>Customer:</strong> {workOrder.createdBy}</div>
                      <div style={{marginBottom:4}}><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                      <div style={{marginBottom:4}}><strong>Total Due:</strong> ${grandTotal.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Payment Form */}
            {['tech', 'manager'].includes(role) && workOrder.status === 'waiting-for-payment' && (
              <div style={{marginTop:20}}>
                {!showPaymentForm ? (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    style={{width:'100%', padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}
                  >
                    Record Payment
                  </button>
                ) : (
                  <div style={{padding:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8}}>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                    />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="check">Check</option>
                      <option value="transfer">Transfer</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      style={{width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:14, marginBottom:8}}
                    />
                    <div style={{display:'flex', gap:8}}>
                      <button
                        onClick={submitPayment}
                        style={{flex:1, padding:'8px', background:'#22c55e', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        style={{flex:1, padding:'8px', background:'#6b7280', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Section */}
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Messages</h2>
          
          <div style={{maxHeight:384, overflowY:'auto', marginBottom:16}}>
            {messages.length === 0 && (
              <div style={{fontSize:14, color:'#6b7280', textAlign:'center', padding:20}}>No messages yet</div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{
                  padding:16, 
                  background: msg.sender === 'customer' ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)', 
                  border: `1px solid ${msg.sender === 'customer' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.1)'}`, 
                  borderRadius:8, 
                  marginBottom:12
                }}
              >
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:14, fontWeight:600, color:'#e5e7eb'}}>{msg.senderName}</span>
                  <span style={{fontSize:12, color:'#6b7280'}}>{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div style={{fontSize:14, color:'#b8beca'}}>{msg.body}</div>
              </div>
            ))}
          </div>
          
          <form onSubmit={sendMessage} style={{display:'flex', gap:12}}>
            <input
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={role === 'customer' ? 'Write a message to the tech/manager...' : 'Write a message to the customer...'}
              style={{flex:1, padding:'12px 16px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
            />
            <button 
              type="submit" 
              disabled={sendingMessage}
              style={{padding:'12px 24px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
