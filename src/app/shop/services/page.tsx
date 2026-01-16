'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'diesel' | 'gas'>('all');
  
  const [formData, setFormData] = useState({
    serviceName: '',
    category: 'diesel' as 'diesel' | 'gas',
    price: '',
    duration: '',
    description: '',
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('shopId');

    if (role !== 'shop' && role !== 'manager') {
      router.push('/shop/home');
      return;
    }

    setShopId(id || '');
    fetchServices(id || '');
  }, [router]);

  const fetchServices = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services?shopId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingService
        ? `/api/services/${editingService.id}`
        : '/api/services';
      
      const method = editingService ? 'PUT' : 'POST';
      
      const payload: any = {
        shopId,
        serviceName: formData.serviceName,
        category: formData.category,
      };

      if (formData.price) payload.price = parseFloat(formData.price);
      if (formData.duration) payload.duration = parseInt(formData.duration);
      if (formData.description) payload.description = formData.description;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchServices(shopId);
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchServices(shopId);
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const openEditModal = (service: any) => {
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName,
      category: service.category,
      price: service.price?.toString() || '',
      duration: service.duration?.toString() || '',
      description: service.description || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      serviceName: '',
      category: 'diesel',
      price: '',
      duration: '',
      description: '',
    });
    setEditingService(null);
  };

  const filteredServices = services.filter(s => 
    filterCategory === 'all' || s.category === filterCategory
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', color: '#fff', textAlign: 'center' }}>
          Loading services...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 32, margin: 0 }}>Service Catalog</h1>
            <p style={{ color: '#9aa3b2', margin: '8px 0 0 0' }}>Manage your shop's services and pricing</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={{
              background: '#e5332a',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add Service
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {['all', 'diesel', 'gas'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as any)}
              style={{
                background: filterCategory === cat ? 'rgba(229, 51, 42, 0.2)' : 'rgba(255,255,255,0.05)',
                border: filterCategory === cat ? '2px solid #e5332a' : '2px solid rgba(255,255,255,0.1)',
                color: filterCategory === cat ? '#e5332a' : '#9aa3b2',
                padding: '10px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {cat} {cat !== 'all' && `(${services.filter(s => s.category === cat).length})`}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
            <h3 style={{ color: '#e5e7eb', marginBottom: 8 }}>No services yet</h3>
            <p style={{ color: '#9aa3b2' }}>Add your first service to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filteredServices.map(service => (
              <div
                key={service.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ color: '#e5e7eb', fontSize: 18, margin: '0 0 8px 0' }}>{service.serviceName}</h3>
                    <span
                      style={{
                        display: 'inline-block',
                        background: service.category === 'diesel' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: service.category === 'diesel' ? '#60a5fa' : '#4ade80',
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {service.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openEditModal(service)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: 'none',
                        color: '#60a5fa',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: 'none',
                        color: '#ef4444',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {service.description && (
                  <p style={{ color: '#9aa3b2', fontSize: 14, marginBottom: 16 }}>{service.description}</p>
                )}

                <div style={{ display: 'flex', gap: 16, color: '#e5e7eb', fontSize: 14 }}>
                  {service.price && (
                    <div>
                      <span style={{ color: '#9aa3b2' }}>Price: </span>
                      <span style={{ fontWeight: 600 }}>${service.price.toFixed(2)}</span>
                    </div>
                  )}
                  {service.duration && (
                    <div>
                      <span style={{ color: '#9aa3b2' }}>Duration: </span>
                      <span style={{ fontWeight: 600 }}>{service.duration} min</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
            <div
              style={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 32,
                maxWidth: 500,
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ color: '#fff', marginBottom: 24 }}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Service Name *</label>
                  <input
                    type="text"
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '12px',
                      color: '#fff',
                      fontSize: 15,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'diesel' | 'gas' })}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '12px',
                      color: '#fff',
                      fontSize: 15,
                    }}
                  >
                    <option value="diesel">Diesel</option>
                    <option value="gas">Gas</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '12px',
                        color: '#fff',
                        fontSize: 15,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Duration (min)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '12px',
                        color: '#fff',
                        fontSize: 15,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '12px',
                      color: '#fff',
                      fontSize: 15,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: '#e5332a',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {editingService ? 'Update Service' : 'Add Service'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.1)',
                      color: '#9aa3b2',
                      border: 'none',
                      padding: '12px',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
