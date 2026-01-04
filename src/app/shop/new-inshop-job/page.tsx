'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MaintenanceType } from '../../../types/workorder';
import { createWorkOrderClient } from '@/lib/workordersClient';

export default function ShopNewInShopJob() {
  const router = useRouter();
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
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    if (role !== 'shop') {
      router.push('/auth/login');
      return;
    }
    if (name) setUserName(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      assignedTo: undefined,
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

  const serviceOptions = [
    { value: 'oil-change', label: 'Oil Change' },
    { value: 'brake-service', label: 'Brake Service' },
    { value: 'tire-rotation', label: 'Tire Rotation' },
    { value: 'engine-diagnostic', label: 'Engine Diagnostic' },
    { value: 'transmission-service', label: 'Transmission Service' },
    { value: 'electrical-repair', label: 'Electrical Repair' },
    { value: 'air-conditioning', label: 'A/C Service' },
    { value: 'suspension', label: 'Suspension Repair' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/shop/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🏢 New In-Shop Job</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Create a new in-shop service work order</p>
        </div>
      </div>

      <div style={{maxWidth:900, margin:'0 auto', padding:32}}>
        <form onSubmit={handleSubmit}>
          {/* Customer Information */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Customer Information</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="customer@email.com"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Vehicle Information</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16}}>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Year *</label>
                <input
                  type="text"
                  required
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="2020"
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Make *</label>
                <input
                  type="text"
                  required
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="Ford"
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Model *</label>
                <input
                  type="text"
                  required
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="F-150"
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>VIN</label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({...formData, vin: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="1FTFW1E84MFA12345"
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Mileage</label>
                <input
                  type="text"
                  value={formData.mileage}
                  onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                  placeholder="45000"
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Service Details</h2>
            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:12}}>Select Services *</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12}}>
                {serviceOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleService(option.value)}
                    style={{
                      padding:'12px 16px',
                      background: formData.services.includes(option.value) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                      color: formData.services.includes(option.value) ? '#22c55e' : '#9aa3b2',
                      border: `1px solid ${formData.services.includes(option.value) ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius:8,
                      fontSize:13,
                      fontWeight:600,
                      cursor:'pointer',
                      textAlign:'left'
                    }}
                  >
                    {formData.services.includes(option.value) ? '✓ ' : ''}{option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Appointment Date</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Appointment Time</label>
                <input
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                  style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                />
              </div>
            </div>

            <div>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Estimated Hours</label>
              <input
                type="text"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                placeholder="2.5"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Additional Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={6}
              style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14, resize:'vertical'}}
              placeholder="Enter any additional information about the service..."
            />
          </div>

          {/* Submit Button */}
          <div style={{display:'flex', gap:12}}>
            <Link href="/shop/home" style={{flex:1}}>
              <button type="button" style={{width:'100%', padding:'16px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:16, fontWeight:600, cursor:'pointer'}}>
                Cancel
              </button>
            </Link>
            <button type="submit" style={{flex:1, padding:'16px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:16, fontWeight:600, cursor:'pointer'}}>
              Create In-Shop Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
