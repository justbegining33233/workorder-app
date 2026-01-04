'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Appointment {
  id: string;
  scheduledDate: string;
  serviceType: string;
  status: string;
  notes?: string;
  shop: {
    shopName: string;
    phone: string;
    address: string;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
  };
}

export default function CustomerAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [newAppointment, setNewAppointment] = useState({
    shopId: '',
    vehicleId: '',
    scheduledDate: '',
    serviceType: 'oil-change',
    notes: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'customer') {
      router.push('/auth/login');
      return;
    }
    fetchAppointments();
    fetchShops();
    fetchVehicles();
  }, [router]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops/accepted');
      if (response.ok) {
        const data = await response.json();
        setShops(data);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!newAppointment.shopId || !newAppointment.scheduledDate) {
      alert('Please select a shop and date/time');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newAppointment,
          vehicleId: newAppointment.vehicleId || undefined,
        }),
      });

      if (response.ok) {
        alert('Appointment booked successfully!');
        setShowBookForm(false);
        setNewAppointment({ shopId: '', vehicleId: '', scheduledDate: '', serviceType: 'oil-change', notes: '' });
        fetchAppointments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Appointment cancelled');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e5e7eb', fontSize: 20 }}>Loading appointments...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(229,51,42,0.3)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Link href="/customer/home" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>📅 My Appointments</h1>
              <p style={{ fontSize: 14, color: '#9aa3b2' }}>Book and manage your service appointments</p>
            </div>
            <button
              onClick={() => setShowBookForm(true)}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              + Book Appointment
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
        {/* Appointments List */}
        <div style={{ display: 'grid', gap: 16 }}>
          {appointments.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <h3 style={{ color: '#e5e7eb', fontSize: 20, marginBottom: 8 }}>No Appointments Yet</h3>
              <p style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 20 }}>Book your first appointment to get started</p>
              <button
                onClick={() => setShowBookForm(true)}
                style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Book Appointment
              </button>
            </div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{apt.shop.shopName}</h3>
                    <div style={{ color: '#9aa3b2', fontSize: 14 }}>{apt.shop.address}</div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: apt.status === 'completed' ? 'rgba(16,185,129,0.2)' : apt.status === 'confirmed' ? 'rgba(59,130,246,0.2)' : apt.status === 'cancelled' ? 'rgba(229,51,42,0.2)' : 'rgba(245,158,11,0.2)',
                    color: apt.status === 'completed' ? '#10b981' : apt.status === 'confirmed' ? '#3b82f6' : apt.status === 'cancelled' ? '#e5332a' : '#f59e0b',
                    height: 'fit-content'
                  }}>
                    {apt.status.toUpperCase()}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Date & Time</div>
                    <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>
                      {new Date(apt.scheduledDate).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Service Type</div>
                    <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>
                      {apt.serviceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </div>
                  </div>
                </div>

                {apt.vehicle && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Vehicle</div>
                    <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>
                      {apt.vehicle.year} {apt.vehicle.make} {apt.vehicle.model}
                    </div>
                  </div>
                )}

                {apt.notes && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Notes</div>
                    <div style={{ color: '#e5e7eb', fontSize: 14 }}>{apt.notes}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${apt.shop.phone}`} style={{ flex: 1, padding: '10px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                    📞 Call Shop
                  </a>
                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      style={{ flex: 1, padding: '10px', background: 'rgba(229,51,42,0.2)', color: '#e5332a', border: '1px solid rgba(229,51,42,0.3)', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#2a2a2a', borderRadius: 12, padding: 32, maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Book Appointment</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Select Shop *</label>
                <select
                  value={newAppointment.shopId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, shopId: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                >
                  <option value="">Choose a shop...</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.shopName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newAppointment.scheduledDate}
                  onChange={(e) => setNewAppointment({ ...newAppointment, scheduledDate: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Service Type *</label>
                <select
                  value={newAppointment.serviceType}
                  onChange={(e) => setNewAppointment({ ...newAppointment, serviceType: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                >
                  <option value="oil-change">Oil Change</option>
                  <option value="inspection">Inspection</option>
                  <option value="brake-service">Brake Service</option>
                  <option value="tire-service">Tire Service</option>
                  <option value="engine-repair">Engine Repair</option>
                  <option value="transmission">Transmission</option>
                  <option value="electrical">Electrical</option>
                  <option value="general-repair">General Repair</option>
                </select>
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Vehicle (Optional)</label>
                <select
                  value={newAppointment.vehicleId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, vehicleId: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                >
                  <option value="">No vehicle selected</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Notes (Optional)</label>
                <textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  placeholder="Any special requests or details..."
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', minHeight: 80, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={handleBookAppointment}
                  style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => {
                    setShowBookForm(false);
                    setNewAppointment({ shopId: '', vehicleId: '', scheduledDate: '', serviceType: 'oil-change', notes: '' });
                  }}
                  style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.1)', color: '#9aa3b2', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}