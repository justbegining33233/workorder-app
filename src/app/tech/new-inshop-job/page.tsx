'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MaintenanceType } from '../../../types/workorder';
import { createWorkOrderClient } from '@/lib/workordersClient';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function NewInShopJob() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['tech', 'manager']);
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vin: '',
    mileage: '',
    serviceType: 'maintenance',
    services: [] as string[],
    appointmentDate: '',
    appointmentTime: '',
    estimatedHours: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.name) setUserName(user.name);
  }, [user]);

  if (isLoading) {
    return (
      <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: '#e5e7eb', fontSize: 18}}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth handles redirect
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create work order
    const workOrder = createWorkOrderClient({
      vehicleType: 'personal-vehicle',
      serviceLocationType: 'in-shop',
      services: {
        repairs: [],
        maintenance: formData.services.map(s => ({ type: s as MaintenanceType })),
      },
      issueDescription: {
        symptoms: formData.services.join(', ') || 'In-shop service',
        pictures: [],
        additionalNotes: `Customer: ${formData.customerName}\nPhone: ${formData.customerPhone}\nEmail: ${formData.customerEmail}\nVehicle: ${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel}\nVIN: ${formData.vin}\nMileage: ${formData.mileage}\nAppointment: ${formData.appointmentDate} ${formData.appointmentTime}\nEstimated Hours: ${formData.estimatedHours}\n\n${formData.notes}`,
      },
      status: 'pending',
      assignedTo: userName,
      messages: [],
      partLaborBreakdown: {
        partsUsed: [],
        laborLines: [],
        laborHours: parseFloat(formData.estimatedHours) || 0,
        additionalCharges: [],
      },
      estimate: null,
      createdBy: formData.customerName || userName,
    });
    
    alert(`In-shop job ${workOrder.id} created successfully!`);
    router.push('/workorders/list');
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const commonServices = [
    'Oil Change', 'Brake Service', 'Tire Rotation', 'Engine Diagnostic',
    'Transmission Service', 'AC Service', 'Battery Replacement', 'Alignment',
    'Suspension Repair', 'Exhaust Repair', 'Electrical Repair', 'Tune-up'
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(34,197,94,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
          <Link href="/tech/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🏢 New In-Shop Job</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Create a new in-shop service work order</p>
        </div>
      </div>

      <div style={{maxWidth:900, margin:'0 auto', padding:32}}>
        <form onSubmit={handleSubmit} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:32}}>
          {/* Customer Information */}
          <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Customer Information</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:32}}>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Customer Name</label>
              <input type="text" required value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Phone</label>
              <input type="tel" required value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Email</label>
              <input type="email" value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
          </div>

          {/* Vehicle Information */}
          <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Vehicle Information</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16}}>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Year</label>
              <input type="text" required value={formData.vehicleYear} onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Make</label>
              <input type="text" required value={formData.vehicleMake} onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Model</label>
              <input type="text" required value={formData.vehicleModel} onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32}}>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>VIN</label>
              <input type="text" value={formData.vin} onChange={(e) => setFormData({...formData, vin: e.target.value})} placeholder="Optional" style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Mileage</label>
              <input type="text" required value={formData.mileage} onChange={(e) => setFormData({...formData, mileage: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
          </div>

          {/* Services */}
          <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Services Requested</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:32}}>
            {commonServices.map(service => (
              <div key={service} onClick={() => toggleService(service)} style={{padding:'12px', background:formData.services.includes(service) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', border:`1px solid ${formData.services.includes(service) ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius:8, cursor:'pointer', textAlign:'center', fontSize:13, color:formData.services.includes(service) ? '#22c55e' : '#e5e7eb', fontWeight:600}}>
                {formData.services.includes(service) ? '✓ ' : ''}{service}
              </div>
            ))}
          </div>

          {/* Appointment */}
          <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Appointment Details</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24}}>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Date</label>
              <input type="date" required value={formData.appointmentDate} onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Time</label>
              <input type="time" required value={formData.appointmentTime} onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
            <div>
              <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Est. Hours</label>
              <input type="number" step="0.5" value={formData.estimatedHours} onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})} placeholder="2.5" style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>
          </div>

          <div style={{marginBottom:32}}>
            <label style={{display:'block', fontSize:14, color:'#e5e7eb', marginBottom:8, fontWeight:600}}>Additional Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={4} placeholder="Customer concerns, special instructions..." style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14, resize:'vertical'}} />
          </div>

          <div style={{display:'flex', gap:12}}>
            <button type="submit" style={{flex:1, padding:'14px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer'}}>
              Create In-Shop Job
            </button>
            <Link href="/tech/home" style={{flex:1, textDecoration:'none'}}>
              <button type="button" style={{width:'100%', padding:'14px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer'}}>
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
