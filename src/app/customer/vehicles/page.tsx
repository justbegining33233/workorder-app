'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Vehicle {
  id: string;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  createdAt: string;
}

export default function CustomerVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicleType: 'semi-truck',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'customer') {
      router.push('/auth/login');
      return;
    }
    fetchVehicles();
  }, [router]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!formData.make || !formData.model) {
      alert('Please enter make and model');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Vehicle added successfully!');
        setShowAddForm(false);
        setFormData({ vehicleType: 'semi-truck', make: '', model: '', year: new Date().getFullYear(), vin: '', licensePlate: '' });
        fetchVehicles();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add vehicle');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Failed to add vehicle');
    }
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle || !formData.make || !formData.model) {
      alert('Please enter make and model');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Vehicle updated successfully!');
        setEditingVehicle(null);
        setFormData({ vehicleType: 'semi-truck', make: '', model: '', year: new Date().getFullYear(), vin: '', licensePlate: '' });
        fetchVehicles();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update vehicle');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Vehicle deleted');
        fetchVehicles();
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const startEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleType: vehicle.vehicleType,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      vin: vehicle.vin || '',
      licensePlate: vehicle.licensePlate || ''
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e5e7eb', fontSize: 20 }}>Loading vehicles...</div>
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
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>🚛 My Vehicles</h1>
              <p style={{ fontSize: 14, color: '#9aa3b2' }}>Manage your fleet and vehicle information</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Vehicle
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
        {/* Vehicles Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {vehicles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚛</div>
              <h3 style={{ color: '#e5e7eb', fontSize: 20, marginBottom: 8 }}>No Vehicles Yet</h3>
              <p style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 20 }}>Add your first vehicle to get started</p>
              <button
                onClick={() => setShowAddForm(true)}
                style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Add Vehicle
              </button>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <div key={vehicle.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>
                  {vehicle.vehicleType === 'semi-truck' ? '🚛' : vehicle.vehicleType === 'trailer' ? '🚚' : vehicle.vehicleType === 'equipment' ? '🏗️' : '🚗'}
                </div>
                
                <h3 style={{ color: '#e5e7eb', fontSize: 20, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                
                <div style={{ textAlign: 'center', color: '#9aa3b2', fontSize: 14, marginBottom: 20, textTransform: 'capitalize' }}>
                  {vehicle.vehicleType.replace('-', ' ')}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {vehicle.vin && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                      <span style={{ color: '#9aa3b2', fontSize: 13 }}>VIN:</span>
                      <span style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}>{vehicle.vin}</span>
                    </div>
                  )}
                  {vehicle.licensePlate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                      <span style={{ color: '#9aa3b2', fontSize: 13 }}>License:</span>
                      <span style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}>{vehicle.licensePlate}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                    <span style={{ color: '#9aa3b2', fontSize: 13 }}>Added:</span>
                    <span style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}>
                      {new Date(vehicle.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => startEdit(vehicle)}
                    style={{ flex: 1, padding: '10px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    style={{ flex: 1, padding: '10px', background: 'rgba(229,51,42,0.2)', color: '#e5332a', border: '1px solid rgba(229,51,42,0.3)', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Vehicle Modal */}
      {(showAddForm || editingVehicle) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#2a2a2a', borderRadius: 12, padding: 32, maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Vehicle Type *</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                >
                  <option value="semi-truck">Semi Truck</option>
                  <option value="trailer">Trailer</option>
                  <option value="equipment">Equipment</option>
                  <option value="personal-vehicle">Personal Vehicle</option>
                </select>
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Make *</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., Peterbilt, Kenworth, Volvo"
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., 579, T680, VNL"
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>VIN (Optional)</label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  placeholder="17-character VIN"
                  maxLength={17}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 8, display: 'block' }}>License Plate (Optional)</label>
                <input
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  placeholder="e.g., ABC-1234"
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={editingVehicle ? handleUpdateVehicle : handleAddVehicle}
                  style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingVehicle(null);
                    setFormData({ vehicleType: 'semi-truck', make: '', model: '', year: new Date().getFullYear(), vin: '', licensePlate: '' });
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
