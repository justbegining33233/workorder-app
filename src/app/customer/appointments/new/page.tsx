'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface Shop {
  id: string;
  name: string;
  address: string;
  zipCode: string;
  phone: string;
  rating: number;
  completedJobs: number;
  services: string[];
}

interface ShopService {
  id: string;
  serviceName: string;
  category: string;
  price: number | null;
  duration: number | null;
  description: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;
}

interface AvailabilityData {
  available: boolean;
  reason?: string;
  shopName?: string;
  capacity?: number;
  slotDuration?: number;
  businessHours?: { open: string; close: string };
  slots: TimeSlot[];
}

function NewAppointmentPage() {
  useRequireAuth(['customer']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedShopId = searchParams?.get('shopId') || null;

  // Steps: 1 = Select Shop, 2 = Select Service, 3 = Select Date/Time & Vehicle, 4 = Confirm
  const [step, setStep] = useState(preselectedShopId ? 2 : 1);
  const [shops, setShops] = useState<Shop[]>([]);
  const [services, setServices] = useState<ShopService[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Time slot state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);

  // Form state
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedService, setSelectedService] = useState<ShopService | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchVehicles();
    // Only fetch shops if preselected
    if (preselectedShopId) {
      fetchShops();
    }
  }, []);

  useEffect(() => {
    if (preselectedShopId && shops.length > 0) {
      const shop = shops.find(s => s.id === preselectedShopId);
      if (shop) {
        setSelectedShop(shop);
        fetchShopServices(shop.id);
      }
    }
  }, [preselectedShopId, shops]);

  const fetchShops = async (search?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/customers/shops?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchShops(searchTerm.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearch();
    }
  };

  const fetchShopServices = async (shopId: string) => {
    try {
      setServicesLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching services for shop:', shopId);
      // Use the shop details API which includes services
      const res = await fetch(`/api/customers/shops/${shopId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Services response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Shop data with services:', data);
        setServices(data.shop.services || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Services error:', res.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchAvailability = async (date: string) => {
    if (!selectedShop || !date) return;
    
    try {
      setSlotsLoading(true);
      setTimeSlots([]);
      setAppointmentTime('');
      
      const token = localStorage.getItem('token');
      const duration = selectedService?.duration || 60;
      const res = await fetch(
        `/api/customers/shops/${selectedShop.id}/availability?date=${date}&duration=${duration}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (res.ok) {
        const data: AvailabilityData = await res.json();
        setAvailability(data);
        setTimeSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/customers/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || data || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setSelectedService(null);
    fetchShopServices(shop.id);
    setStep(2);
  };

  const handleServiceSelect = (service: ShopService) => {
    setSelectedService(service);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedShop || !selectedService || !appointmentDate || !appointmentTime) {
      alert('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const scheduledDate = new Date(`${appointmentDate}T${appointmentTime}`).toISOString();
      
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId: selectedShop.id,
          serviceId: selectedService.id,
          serviceType: selectedService.serviceName,
          vehicleId: selectedVehicle || undefined,
          scheduledDate,
          notes
        })
      });

      if (res.ok) {
        router.push('/customer/appointments?success=true');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const cat = service.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, ShopService[]>);

  const formatDuration = (duration: number | null) => {
    if (!duration) return '';
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(229,51,42,0.3)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Link href="/customer/appointments" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'inline-block' }}>
            ← Back to Appointments
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>📅 Book New Appointment</h1>
          <p style={{ fontSize: 14, color: '#9aa3b2' }}>Schedule a service at your preferred auto shop</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[
            { num: 1, label: 'Select Shop' },
            { num: 2, label: 'Choose Service' },
            { num: 3, label: 'Date & Details' },
            { num: 4, label: 'Confirm' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: step >= s.num ? '#e5332a' : 'rgba(255,255,255,0.1)',
                  color: step >= s.num ? 'white' : '#9aa3b2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{ color: step >= s.num ? '#e5e7eb' : '#6b7280', fontSize: 13, fontWeight: 600 }}>{s.label}</span>
              </div>
              {i < 3 && <div style={{ width: 40, height: 2, background: step > s.num ? '#e5332a' : 'rgba(255,255,255,0.1)' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        {/* Step 1: Select Shop */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Select a Shop</h2>
            
            {/* Search */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12, maxWidth: 600 }}>
                <input
                  type="text"
                  placeholder="Enter zip code or shop name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    flex: 1, padding: '14px 16px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#e5e7eb', fontSize: 16
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || loading}
                  style={{
                    padding: '14px 28px',
                    background: searchTerm.trim() ? '#e5332a' : 'rgba(255,255,255,0.1)',
                    color: 'white', border: 'none', borderRadius: 8,
                    fontSize: 15, fontWeight: 700, cursor: searchTerm.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {loading ? '...' : '🔍 Search'}
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                Search by zip code (e.g., 18101) or shop name
              </div>
            </div>

            {!hasSearched ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9aa3b2' }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>Find a Shop</div>
                <div style={{ fontSize: 14 }}>Enter a zip code or shop name above to search for auto shops in your area</div>
              </div>
            ) : loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa3b2' }}>Searching shops...</div>
            ) : shops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa3b2' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>No shops found for "{searchTerm}"</div>
                <div style={{ fontSize: 13 }}>Try a different zip code or shop name</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {shops.map(shop => (
                  <div
                    key={shop.id}
                    onClick={() => handleShopSelect(shop)}
                    style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(229,51,42,0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>{shop.name}</h3>
                      {shop.rating > 0 && (
                        <span style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                          ⭐ {shop.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>📍 {shop.address}</div>
                    {shop.zipCode && <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>🏷️ {shop.zipCode}</div>}
                    {shop.completedJobs > 0 && (
                      <div style={{ fontSize: 12, color: '#22c55e' }}>✓ {shop.completedJobs} jobs completed</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Service */}
        {step === 2 && selectedShop && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => { setStep(1); setSelectedShop(null); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14 }}>
                ← Change Shop
              </button>
              <span style={{ color: '#6b7280' }}>|</span>
              <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{selectedShop.name}</span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Choose a Service</h2>

            {servicesLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa3b2' }}>Loading services...</div>
            ) : services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa3b2' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
                <p>This shop hasn&apos;t added any services yet.</p>
                <button onClick={() => { setStep(1); setSelectedShop(null); }} style={{ marginTop: 16, padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Choose Another Shop
                </button>
              </div>
            ) : (
              <div>
                {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category} style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#9aa3b2', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {category}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {categoryServices.map(service => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          style={{
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                            e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb', marginBottom: 4 }}>{service.serviceName}</div>
                            {service.description && (
                              <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 8 }}>{service.description}</div>
                            )}
                            {service.duration && (
                              <div style={{ fontSize: 12, color: '#6b7280' }}>⏱️ Estimated: {formatDuration(service.duration)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date, Time, Vehicle */}
        {step === 3 && selectedShop && selectedService && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14 }}>
                ← Change Service
              </button>
              <span style={{ color: '#6b7280' }}>|</span>
              <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{selectedShop.name}</span>
              <span style={{ color: '#6b7280' }}>→</span>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>{selectedService.serviceName}</span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Select Date & Time</h2>

            <div style={{ maxWidth: 600 }}>
              {/* Date */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: '#9aa3b2', fontSize: 13, marginBottom: 8 }}>Select Date *</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value);
                    setAppointmentTime('');
                    if (e.target.value) {
                      fetchAvailability(e.target.value);
                    }
                  }}
                  min={today}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#e5e7eb', fontSize: 14
                  }}
                />
              </div>

              {/* Time Slots */}
              {appointmentDate && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', color: '#9aa3b2', fontSize: 13, marginBottom: 8 }}>
                    Select Time *
                    {availability?.businessHours && (
                      <span style={{ marginLeft: 8, color: '#6b7280' }}>
                        (Open {availability.businessHours.open} - {availability.businessHours.close})
                      </span>
                    )}
                  </label>
                  
                  {slotsLoading ? (
                    <div style={{ textAlign: 'center', padding: 30, color: '#9aa3b2' }}>
                      Loading available times...
                    </div>
                  ) : availability && !availability.available ? (
                    <div style={{
                      padding: 20, background: 'rgba(239,68,68,0.1)', borderRadius: 8,
                      border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center'
                    }}>
                      <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>
                        😔 Not Available
                      </div>
                      <div style={{ color: '#9aa3b2', fontSize: 13 }}>
                        {availability.reason || 'This shop is closed on the selected date'}
                      </div>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, color: '#9aa3b2' }}>
                      No time slots available for this date
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                      {timeSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setAppointmentTime(slot.time)}
                          disabled={!slot.available}
                          style={{
                            padding: '12px 8px',
                            background: appointmentTime === slot.time 
                              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                              : slot.available 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(239,68,68,0.1)',
                            border: appointmentTime === slot.time 
                              ? '2px solid #3b82f6'
                              : slot.available 
                                ? '1px solid rgba(255,255,255,0.1)' 
                                : '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 8,
                            color: appointmentTime === slot.time 
                              ? 'white'
                              : slot.available 
                                ? '#e5e7eb' 
                                : '#ef4444',
                            fontSize: 14,
                            fontWeight: appointmentTime === slot.time ? 700 : 500,
                            cursor: slot.available ? 'pointer' : 'not-allowed',
                            opacity: slot.available ? 1 : 0.5,
                            transition: 'all 0.2s'
                          }}
                        >
                          {slot.time}
                          {!slot.available && <span style={{ display: 'block', fontSize: 10 }}>Full</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#9aa3b2', fontSize: 13, marginBottom: 8 }}>Select Vehicle (Optional)</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#e5e7eb', fontSize: 14
                  }}
                >
                  <option value="">No vehicle selected</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} ({v.licensePlate})</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: '#9aa3b2', fontSize: 13, marginBottom: 8 }}>Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or details..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#e5e7eb', fontSize: 14, resize: 'vertical'
                  }}
                />
              </div>

              <button
                onClick={() => setStep(4)}
                disabled={!appointmentDate || !appointmentTime}
                style={{
                  width: '100%', padding: '14px',
                  background: (!appointmentDate || !appointmentTime) ? '#4b5563' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700,
                  cursor: (!appointmentDate || !appointmentTime) ? 'not-allowed' : 'pointer'
                }}
              >
                Review Appointment →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && selectedShop && selectedService && (
          <div>
            <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
              ← Back to Details
            </button>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Confirm Your Appointment</h2>

            <div style={{ maxWidth: 500, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
              {/* Shop */}
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>SHOP</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>{selectedShop.name}</div>
                <div style={{ fontSize: 13, color: '#9aa3b2' }}>{selectedShop.address}</div>
              </div>

              {/* Service */}
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>SERVICE</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>{selectedService.serviceName}</div>
                {selectedService.duration && (
                  <div style={{ fontSize: 13, color: '#9aa3b2', marginTop: 4 }}>Estimated duration: {formatDuration(selectedService.duration)}</div>
                )}
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' }}>
                  💡 Final pricing will be provided by the shop
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>DATE & TIME</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>
                  {new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 14, color: '#3b82f6' }}>
                  {new Date(`2000-01-01T${appointmentTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </div>

              {/* Vehicle */}
              {selectedVehicle && (
                <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>VEHICLE</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>
                    {vehicles.find(v => v.id === selectedVehicle)?.year} {vehicles.find(v => v.id === selectedVehicle)?.make} {vehicles.find(v => v.id === selectedVehicle)?.model}
                  </div>
                </div>
              )}

              {/* Notes */}
              {notes && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>NOTES</div>
                  <div style={{ fontSize: 14, color: '#e5e7eb' }}>{notes}</div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%', padding: '14px',
                  background: submitting ? '#4b5563' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Booking...' : '✓ Confirm Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NewAppointmentPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewAppointmentPage />
    </Suspense>
  );
}

export default NewAppointmentPageWrapper;
