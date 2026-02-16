'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

const CATEGORY_CONFIG: Array<{ id: CategoryId; label: string; note?: string }> = [
  { id: 'diesel', label: 'Diesel / Heavy-Duty Services' },
  { id: 'gas', label: 'Gas / Automotive Services' },
  { id: 'small-engine', label: 'Small Engine Services' },
  { id: 'heavy-equipment', label: 'Heavy Equipment Services' },
  { id: 'resurfacing', label: 'Resurfacing / Machining' },
  { id: 'welding', label: 'Welding & Fabrication' },
  { id: 'tire', label: 'Tire Shop Services' },
];

export default function CompleteProfile() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessLicense: '',
    insurancePolicy: '',
    shopType: 'diesel' as 'diesel' | 'gas' | 'small-engine' | 'heavy-equipment' | 'resurfacing' | 'welding' | 'tire' | 'mixed',
    dieselServices: [] as string[],
    gasServices: [] as string[],
    smallEngineServices: [] as string[],
    heavyEquipmentServices: [] as string[],
    resurfacingServices: [] as string[],
    weldingServices: [] as string[],
    tireServices: [] as string[],
  });

  const handleServiceToggle = (service: string, category: CategoryId) => {
    const keyMap: Record<CategoryId, keyof typeof formData> = {
      diesel: 'dieselServices',
      gas: 'gasServices',
      'small-engine': 'smallEngineServices',
      'heavy-equipment': 'heavyEquipmentServices',
      resurfacing: 'resurfacingServices',
      welding: 'weldingServices',
      tire: 'tireServices',
    };

    const key = keyMap[category];
    setFormData((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(service) ? current.filter((s) => s !== service) : [...current, service];
      const updated = { ...prev, [key]: next };
      return { ...updated };
    });
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

    const totalSelected =
      formData.dieselServices.length +
      formData.gasServices.length +
      formData.smallEngineServices.length +
      formData.heavyEquipmentServices.length +
      formData.resurfacingServices.length +
      formData.weldingServices.length +
      formData.tireServices.length;

    if (totalSelected === 0) {
      alert('Please select at least one service');
      return;
    }

    const requiredByType: Record<CategoryId | 'mixed', number> = {
      diesel: formData.dieselServices.length,
      gas: formData.gasServices.length,
      'small-engine': formData.smallEngineServices.length,
      'heavy-equipment': formData.heavyEquipmentServices.length,
      resurfacing: formData.resurfacingServices.length,
      welding: formData.weldingServices.length,
      tire: formData.tireServices.length,
      mixed: totalSelected,
    };

    if (!requiredByType[formData.shopType]) {
      alert('Please select at least one service in your chosen shop category');
      return;
    }

    setSubmitting(true);

    try {
      const shopId = localStorage.getItem('shopId');
      if (!shopId) {
        alert('Missing shop session. Please log in as your shop account and try again.');
        return;
      }

      // Obtain CSRF token (double-submit) similar to registration flow
      await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' });
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
        let errorMessage = 'Failed to complete profile';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || error.detail || error.errorMessage || errorMessage;
        } catch (parseErr) {
          // ignore
        }
        console.error('Complete profile failed', { status: response.status, errorMessage });
        alert(`Error: ${errorMessage}`);
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
            Please provide the following information to activate your shop account. Choose one of the seven shop categories below.
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
                <option value="diesel">Diesel / Heavy-Duty Services</option>
                <option value="gas">Gas / Automotive Services</option>
                <option value="small-engine">Small Engine Services</option>
                <option value="heavy-equipment">Heavy Equipment Services</option>
                <option value="resurfacing">Resurfacing / Machining</option>
                <option value="welding">Welding & Fabrication</option>
                <option value="tire">Tire Shop Services</option>
                <option value="mixed">Mixed / Multi-Category</option>
              </select>
            </div>

            {/* Services by category */}
            <div style={{display:'grid', gap:24, marginBottom:32}}>
              {CATEGORY_CONFIG.map((cat) => {
                const options = SERVICE_OPTIONS[cat.id] || [];
                const selectedMap: Record<CategoryId, string[]> = {
                  diesel: formData.dieselServices,
                  gas: formData.gasServices,
                  'small-engine': formData.smallEngineServices,
                  'heavy-equipment': formData.heavyEquipmentServices,
                  resurfacing: formData.resurfacingServices,
                  welding: formData.weldingServices,
                  tire: formData.tireServices,
                };
                const selected = selectedMap[cat.id] || [];

                return (
                  <div key={cat.id}>
                    <label style={{display:'block', color:'#e5e7eb', fontWeight:600, marginBottom:12}}>
                      {cat.label} <span style={{color:'#e5332a'}}>*</span>
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
                        {options.map((service) => (
                          <label key={service} style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#e5e7eb'}}>
                            <input
                              type="checkbox"
                              checked={selected.includes(service)}
                              onChange={() => handleServiceToggle(service, cat.id)}
                              style={{cursor:'pointer'}}
                            />
                            <span style={{fontSize:14}}>{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
