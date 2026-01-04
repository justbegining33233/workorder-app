'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShopFormData, ShopType, ServiceLocation, DieselServiceType, GasServiceType } from '../types/shop';
import '../styles/sos-theme.css';

const dieselServiceOptions: { value: DieselServiceType; label: string }[] = [
  { value: 'engine-diagnostics', label: 'Engine Diagnostics' },
  { value: 'engine-repair', label: 'Engine Repair' },
  { value: 'engine-rebuild', label: 'Engine Rebuild' },
  { value: 'transmission-repair', label: 'Transmission Repair' },
  { value: 'brake-system', label: 'Brake System' },
  { value: 'air-brake-service', label: 'Air Brake Service' },
  { value: 'electrical-diagnostics', label: 'Electrical Diagnostics' },
  { value: 'electrical-repair', label: 'Electrical Repair' },
  { value: 'tire-service', label: 'Tire Service' },
  { value: 'tire-replacement', label: 'Tire Replacement' },
  { value: 'wheel-alignment', label: 'Wheel Alignment' },
  { value: 'suspension-repair', label: 'Suspension Repair' },
  { value: 'hydraulic-systems', label: 'Hydraulic Systems' },
  { value: 'air-conditioning', label: 'Air Conditioning' },
  { value: 'exhaust-repair', label: 'Exhaust Repair' },
  { value: 'def-system', label: 'DEF System' },
  { value: 'dpf-cleaning', label: 'DPF Cleaning' },
  { value: 'oil-change', label: 'Oil Change' },
  { value: 'preventive-maintenance', label: 'Preventive Maintenance' },
  { value: 'dot-inspections', label: 'DOT Inspections' },
  { value: 'trailer-repair', label: 'Trailer Repair' },
  { value: 'reefer-repair', label: 'Reefer Repair' },
  { value: 'welding', label: 'Welding' },
  { value: 'roadside-assistance', label: 'Roadside Assistance' },
];

const gasServiceOptions: { value: GasServiceType; label: string }[] = [
  { value: 'engine-diagnostics', label: 'Engine Diagnostics' },
  { value: 'engine-repair', label: 'Engine Repair' },
  { value: 'transmission-service', label: 'Transmission Service' },
  { value: 'transmission-repair', label: 'Transmission Repair' },
  { value: 'brake-service', label: 'Brake Service' },
  { value: 'brake-replacement', label: 'Brake Replacement' },
  { value: 'oil-change', label: 'Oil Change' },
  { value: 'tune-up', label: 'Tune-Up' },
  { value: 'electrical-diagnostics', label: 'Electrical Diagnostics' },
  { value: 'electrical-repair', label: 'Electrical Repair' },
  { value: 'battery-service', label: 'Battery Service' },
  { value: 'tire-rotation', label: 'Tire Rotation' },
  { value: 'tire-replacement', label: 'Tire Replacement' },
  { value: 'wheel-alignment', label: 'Wheel Alignment' },
  { value: 'suspension-repair', label: 'Suspension Repair' },
  { value: 'air-conditioning', label: 'Air Conditioning' },
  { value: 'heating-repair', label: 'Heating Repair' },
  { value: 'exhaust-repair', label: 'Exhaust Repair' },
  { value: 'catalytic-converter', label: 'Catalytic Converter' },
  { value: 'emissions-testing', label: 'Emissions Testing' },
  { value: 'state-inspection', label: 'State Inspection' },
  { value: 'windshield-replacement', label: 'Windshield Replacement' },
  { value: 'fluid-service', label: 'Fluid Service' },
  { value: 'coolant-flush', label: 'Coolant Flush' },
  { value: 'fuel-system-cleaning', label: 'Fuel System Cleaning' },
  { value: 'timing-belt', label: 'Timing Belt Replacement' },
  { value: 'roadside-assistance', label: 'Roadside Assistance' },
];

export default function ShopRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<ShopFormData>({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    shopType: 'diesel-heavy-duty',
    serviceLocation: 'both',
    dieselServices: [],
    gasServices: [],
    address: '',
    city: '',
    state: '',
    zipCode: '',
    mobileServiceRadius: 50,
    emergencyService24_7: false,
    acceptedPaymentMethods: ['cash', 'credit-card'],
  });

  const handleServiceToggle = (service: DieselServiceType | GasServiceType, type: 'diesel' | 'gas') => {
    if (type === 'diesel') {
      setFormData((prev: ShopFormData) => ({
        ...prev,
        dieselServices: prev.dieselServices.includes(service as DieselServiceType)
          ? prev.dieselServices.filter((s: DieselServiceType) => s !== service)
          : [...prev.dieselServices, service as DieselServiceType]
      }));
    } else {
      setFormData((prev: ShopFormData) => ({
        ...prev,
        gasServices: prev.gasServices.includes(service as GasServiceType)
          ? prev.gasServices.filter((s: GasServiceType) => s !== service)
          : [...prev.gasServices, service as GasServiceType]
      }));
    }
  };

  const handlePaymentMethodToggle = (method: 'cash' | 'credit-card' | 'debit-card' | 'check' | 'financing') => {
    setFormData((prev: ShopFormData) => ({
      ...prev,
      acceptedPaymentMethods: prev.acceptedPaymentMethods.includes(method)
        ? prev.acceptedPaymentMethods.filter((m: 'cash' | 'credit-card' | 'debit-card' | 'check' | 'financing') => m !== method)
        : [...prev.acceptedPaymentMethods, method]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      // Obtain a public CSRF token (double-submit) and set cookie
      await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' });
      // Read CSRF token from cookie
      const m = document.cookie.match("(?:^|; )csrf_token=([^;]+)");
      const csrf = m ? decodeURIComponent(m[1]) : '';
      const res = await fetch('/api/shops/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/auth/thank-you');
      }
    } catch (error) {
      console.error('Shop registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDieselServices = formData.shopType === 'diesel-heavy-duty' || formData.shopType === 'both';
  const showGasServices = formData.shopType === 'gas-automotive' || formData.shopType === 'both';

  return (
    <div className="sos-wrap">
      <div className="sos-card" style={{maxWidth:800}}>
        <div className="sos-header">
          <div className="sos-brand">
            <span className="mark">SOS</span>
            <span className="sub">Shop Registration</span>
          </div>
          <div style={{fontSize:13, color:'#9aa3b2'}}>Step {step} of 4</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sos-pane" style={{padding:28}}>
            
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div>
                <div className="sos-title">Basic Information</div>
                <p className="sos-desc">Tell us about your shop</p>

                <div style={{marginTop:24, display:'flex', flexDirection:'column', gap:16}}>
                  <div>
                    <label className="sos-label">Shop Name *</label>
                    <input
                      className="sos-input"
                      value={formData.shopName}
                      onChange={e => setFormData({...formData, shopName: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="sos-label">Owner Name *</label>
                    <input
                      className="sos-input"
                      value={formData.ownerName}
                      onChange={e => setFormData({...formData, ownerName: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="sos-label">Email *</label>
                    <input
                      type="email"
                      className="sos-input"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="sos-label">Phone *</label>
                    <input
                      type="tel"
                      className="sos-input"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shop Type & Service Location */}
            {step === 2 && (
              <div>
                <div className="sos-title">Shop Type & Services</div>
                <p className="sos-desc">What type of vehicles do you service?</p>

                <div style={{marginTop:24}}>
                  <label className="sos-label">Shop Type *</label>
                  <div style={{display:'flex', flexDirection:'column', gap:12, marginTop:8}}>
                    {[
                      { value: 'diesel-heavy-duty', label: 'Diesel / Heavy-Duty (Trucks, Trailers, Equipment)' },
                      { value: 'gas-automotive', label: 'Gas / Automotive (Cars, SUVs, Light Trucks)' },
                      { value: 'both', label: 'Both Diesel & Gas' },
                    ].map(option => (
                      <label key={option.value} className="sos-item" style={{cursor:'pointer', padding:16}}>
                        <input
                          type="radio"
                          checked={formData.shopType === option.value}
                          onChange={() => setFormData({...formData, shopType: option.value as ShopType})}
                        />
                        <span style={{marginLeft:12, fontSize:14}}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{marginTop:24}}>
                  <label className="sos-label">Service Location *</label>
                  <div style={{display:'flex', flexDirection:'column', gap:12, marginTop:8}}>
                    {[
                      { value: 'mobile-only', label: 'Mobile/Roadside Only' },
                      { value: 'shop-only', label: 'Shop Location Only' },
                      { value: 'both', label: 'Both Mobile & Shop' },
                    ].map(option => (
                      <label key={option.value} className="sos-item" style={{cursor:'pointer', padding:16}}>
                        <input
                          type="radio"
                          checked={formData.serviceLocation === option.value}
                          onChange={() => setFormData({...formData, serviceLocation: option.value as ServiceLocation})}
                        />
                        <span style={{marginLeft:12, fontSize:14}}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.serviceLocation !== 'shop-only' && (
                  <div style={{marginTop:24}}>
                    <label className="sos-label">Mobile Service Radius (miles)</label>
                    <input
                      type="number"
                      className="sos-input"
                      value={formData.mobileServiceRadius || ''}
                      onChange={e => setFormData({...formData, mobileServiceRadius: parseInt(e.target.value) || 0})}
                      placeholder="50"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Services Offered */}
            {step === 3 && (
              <div>
                <div className="sos-title">Services You Offer</div>
                <p className="sos-desc">Select all services your shop provides</p>

                {showDieselServices && (
                  <div style={{marginTop:24}}>
                    <div style={{fontSize:16, fontWeight:700, marginBottom:12}}>Diesel / Heavy-Duty Services</div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
                      {dieselServiceOptions.map(service => (
                        <label key={service.value} className="sos-item" style={{cursor:'pointer', padding:12}}>
                          <input
                            type="checkbox"
                            checked={formData.dieselServices.includes(service.value)}
                            onChange={() => handleServiceToggle(service.value, 'diesel')}
                          />
                          <span style={{marginLeft:8, fontSize:13}}>{service.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {showGasServices && (
                  <div style={{marginTop:32}}>
                    <div style={{fontSize:16, fontWeight:700, marginBottom:12}}>Gas / Automotive Services</div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
                      {gasServiceOptions.map(service => (
                        <label key={service.value} className="sos-item" style={{cursor:'pointer', padding:12}}>
                          <input
                            type="checkbox"
                            checked={formData.gasServices.includes(service.value)}
                            onChange={() => handleServiceToggle(service.value, 'gas')}
                          />
                          <span style={{marginLeft:8, fontSize:13}}>{service.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Location & Additional Info */}
            {step === 4 && (
              <div>
                <div className="sos-title">Location & Business Details</div>
                <p className="sos-desc">Where is your shop located?</p>

                <div style={{marginTop:24, display:'flex', flexDirection:'column', gap:16}}>
                  <div>
                    <label className="sos-label">Street Address *</label>
                    <input
                      className="sos-input"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      required
                    />
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12}}>
                    <div>
                      <label className="sos-label">City *</label>
                      <input
                        className="sos-input"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="sos-label">State *</label>
                      <input
                        className="sos-input"
                        value={formData.state}
                        onChange={e => setFormData({...formData, state: e.target.value})}
                        required
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="sos-label">Zip *</label>
                      <input
                        className="sos-input"
                        value={formData.zipCode}
                        onChange={e => setFormData({...formData, zipCode: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="sos-label">Accepted Payment Methods</label>
                    <div style={{display:'flex', gap:12, marginTop:8, flexWrap:'wrap'}}>
                      {['cash', 'credit-card', 'debit-card', 'check', 'financing'].map(method => (
                        <label key={method} style={{cursor:'pointer', display:'flex', alignItems:'center'}}>
                          <input
                            type="checkbox"
                            checked={formData.acceptedPaymentMethods.includes(method as any)}
                            onChange={() => handlePaymentMethodToggle(method as any)}
                          />
                          <span style={{marginLeft:8, fontSize:13, textTransform:'capitalize'}}>
                            {method.replace('-', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label style={{cursor:'pointer', display:'flex', alignItems:'center'}}>
                    <input
                      type="checkbox"
                      checked={formData.emergencyService24_7}
                      onChange={e => setFormData({...formData, emergencyService24_7: e.target.checked})}
                    />
                    <span style={{marginLeft:8, fontSize:14}}>We offer 24/7 emergency service</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="sos-footer">
            <div style={{display:'flex', gap:12}}>
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="btn-outline">
                  ← Back
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : step === 4 ? 'Complete Registration' : 'Next →'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
