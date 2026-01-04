'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function CompleteProfile() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessLicense: '',
    insurancePolicy: '',
    shopType: 'both' as 'diesel-heavy-duty' | 'gas-automotive' | 'both',
    dieselServices: [] as string[],
    gasServices: [] as string[],
  });

  const handleServiceToggle = (service: string, type: 'diesel' | 'gas') => {
    if (type === 'diesel') {
      setFormData(prev => ({
        ...prev,
        dieselServices: prev.dieselServices.includes(service)
          ? prev.dieselServices.filter(s => s !== service)
          : [...prev.dieselServices, service]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        gasServices: prev.gasServices.includes(service)
          ? prev.gasServices.filter(s => s !== service)
          : [...prev.gasServices, service]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.businessLicense.trim()) {
      alert('Please enter your business license number');
      return;
    }
    
    if (!formData.insurancePolicy.trim()) {
      alert('Please enter your insurance policy number');
      return;
    }

    const servicesSelected = formData.shopType === 'diesel-heavy-duty' 
      ? formData.dieselServices.length > 0
      : formData.shopType === 'gas-automotive'
      ? formData.gasServices.length > 0
      : formData.dieselServices.length > 0 || formData.gasServices.length > 0;

    if (!servicesSelected) {
      alert('Please select at least one service');
      return;
    }

    setSubmitting(true);

    try {
      const shopId = localStorage.getItem('shopId');
      
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/complete-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify({
          shopId,
          ...formData
        }),
      });

      if (response.ok) {
        // Mark profile as complete in localStorage
        localStorage.setItem('shopProfileComplete', 'true');
        alert('✅ Profile completed successfully! You can now access your shop dashboard.');
        router.push('/shop/home');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to complete profile'}`);
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      alert('Failed to complete profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Link href="/" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>SOS</Link>
        <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>Complete Your Shop Profile</div>
      </div>

      <div style={{maxWidth:900, margin:'0 auto', padding:32}}>
        <div style={{background:'rgba(0,0,0,0.2)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:32}}>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>
            Welcome! Let's Complete Your Shop Profile
          </h1>
          <p style={{color:'#9aa3b2', marginBottom:32}}>
            Please provide the following information to activate your shop account.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Business License */}
            <div style={{marginBottom:24}}>
              <label style={{display:'block', color:'#e5e7eb', fontWeight:600, marginBottom:8}}>
                Business License Number <span style={{color:'#e5332a'}}>*</span>
              </label>
              <input
                type="text"
                value={formData.businessLicense}
                onChange={(e) => setFormData({...formData, businessLicense: e.target.value})}
                placeholder="Enter your business license number"
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  background:'rgba(0,0,0,0.3)',
                  border:'1px solid rgba(229,51,42,0.3)',
                  borderRadius:8,
                  color:'#e5e7eb',
                  fontSize:14
                }}
                required
              />
            </div>

            {/* Insurance Policy */}
            <div style={{marginBottom:24}}>
              <label style={{display:'block', color:'#e5e7eb', fontWeight:600, marginBottom:8}}>
                Insurance Policy Number <span style={{color:'#e5332a'}}>*</span>
              </label>
              <input
                type="text"
                value={formData.insurancePolicy}
                onChange={(e) => setFormData({...formData, insurancePolicy: e.target.value})}
                placeholder="Enter your insurance policy number"
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  background:'rgba(0,0,0,0.3)',
                  border:'1px solid rgba(229,51,42,0.3)',
                  borderRadius:8,
                  color:'#e5e7eb',
                  fontSize:14
                }}
                required
              />
            </div>

            {/* Shop Type */}
            <div style={{marginBottom:24}}>
              <label style={{display:'block', color:'#e5e7eb', fontWeight:600, marginBottom:8}}>
                Shop Type <span style={{color:'#e5332a'}}>*</span>
              </label>
              <select
                value={formData.shopType}
                onChange={(e) => setFormData({...formData, shopType: e.target.value as any})}
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  background:'rgba(0,0,0,0.3)',
                  border:'1px solid rgba(229,51,42,0.3)',
                  borderRadius:8,
                  color:'#e5e7eb',
                  fontSize:14
                }}
              >
                <option value="diesel-heavy-duty">Diesel/Heavy-Duty Only</option>
                <option value="gas-automotive">Gas/Automotive Only</option>
                <option value="both">Both Diesel & Gas</option>
              </select>
            </div>

            {/* Diesel Services */}
            {(formData.shopType === 'diesel-heavy-duty' || formData.shopType === 'both') && (
              <div style={{marginBottom:24}}>
                <label style={{display:'block', color:'#e5e7eb', fontWeight:600, marginBottom:12}}>
                  Diesel/Heavy-Duty Services Offered <span style={{color:'#e5332a'}}>*</span>
                </label>
                <div style={{
                  background:'rgba(0,0,0,0.3)',
                  border:'1px solid rgba(229,51,42,0.3)',
                  borderRadius:8,
                  padding:20,
                  maxHeight:300,
                  overflowY:'auto'
                }}>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12}}>
                    {DIESEL_SERVICES.map(service => (
                      <label key={service} style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#e5e7eb'}}>
                        <input
                          type="checkbox"
                          checked={formData.dieselServices.includes(service)}
                          onChange={() => handleServiceToggle(service, 'diesel')}
                          style={{cursor:'pointer'}}
                        />
                        <span style={{fontSize:14}}>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gas Services */}
            {(formData.shopType === 'gas-automotive' || formData.shopType === 'both') && (
              <div style={{marginBottom:32}}>
                <label style={{display:'block', color:'#e5e7eb', fontWeight:600, marginBottom:12}}>
                  Gas/Automotive Services Offered <span style={{color:'#e5332a'}}>*</span>
                </label>
                <div style={{
                  background:'rgba(0,0,0,0.3)',
                  border:'1px solid rgba(229,51,42,0.3)',
                  borderRadius:8,
                  padding:20,
                  maxHeight:300,
                  overflowY:'auto'
                }}>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12}}>
                    {GAS_SERVICES.map(service => (
                      <label key={service} style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#e5e7eb'}}>
                        <input
                          type="checkbox"
                          checked={formData.gasServices.includes(service)}
                          onChange={() => handleServiceToggle(service, 'gas')}
                          style={{cursor:'pointer'}}
                        />
                        <span style={{fontSize:14}}>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width:'100%',
                padding:'14px 24px',
                background: submitting ? '#666' : '#e5332a',
                color:'white',
                border:'none',
                borderRadius:8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize:16,
                fontWeight:700
              }}
            >
              {submitting ? 'Completing Profile...' : 'Complete Profile & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
