'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopInventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    sku: '',
    quantity: '',
    price: '',
    reorderPoint: '',
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('shopId');

    if (role !== 'shop' && role !== 'manager') {
      router.push('/shop/home');
      return;
    }

    setShopId(id || '');
    fetchInventory(id || '');
  }, [router]);

  const fetchInventory = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const lowStockParam = showLowStockOnly ? '&lowStockOnly=true' : '';
      const response = await fetch(`/api/inventory?shopId=${id}${lowStockParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingItem
        ? `/api/inventory/${editingItem.id}`
        : '/api/inventory';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const payload: any = {
        shopId,
        type: formData.type,
        name: formData.name,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
      };

      if (formData.sku) payload.sku = formData.sku;
      if (formData.reorderPoint) payload.reorderPoint = parseInt(formData.reorderPoint);
      if (formData.supplier) payload.supplier = formData.supplier;
      if (formData.notes) payload.notes = formData.notes;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchInventory(shopId);
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchInventory(shopId);
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      name: item.name,
      sku: item.sku || '',
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      reorderPoint: item.reorderPoint?.toString() || '',
      supplier: item.supplier || '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: '',
      name: '',
      sku: '',
      quantity: '',
      price: '',
      reorderPoint: '',
      supplier: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const lowStockItems = inventory.filter(item => 
    item.reorderPoint && item.quantity <= item.reorderPoint
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', color: '#fff', textAlign: 'center' }}>
          Loading inventory...
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
            <h1 style={{ color: '#fff', fontSize: 32, margin: 0 }}>Inventory Management</h1>
            <p style={{ color: '#9aa3b2', margin: '8px 0 0 0' }}>Track parts and supplies</p>
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
            + Add Item
          </button>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div>
                <h3 style={{ color: '#ef4444', margin: 0, fontSize: 18 }}>Low Stock Alert</h3>
                <p style={{ color: '#9aa3b2', margin: '4px 0 0 0' }}>
                  {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need reordering
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toggle */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => {
              setShowLowStockOnly(!showLowStockOnly);
              setLoading(true);
              setTimeout(() => fetchInventory(shopId), 100);
            }}
            style={{
              background: showLowStockOnly ? 'rgba(229, 51, 42, 0.2)' : 'rgba(255,255,255,0.05)',
              border: showLowStockOnly ? '2px solid #e5332a' : '2px solid rgba(255,255,255,0.1)',
              color: showLowStockOnly ? '#e5332a' : '#9aa3b2',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {showLowStockOnly ? 'Show All Items' : 'Show Low Stock Only'}
          </button>
        </div>

        {/* Inventory Table */}
        {inventory.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <h3 style={{ color: '#e5e7eb', marginBottom: 8 }}>No inventory items</h3>
            <p style={{ color: '#9aa3b2' }}>Add your first item to get started</p>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: 16, textAlign: 'right', color: '#9aa3b2', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Quantity</th>
                  <th style={{ padding: 16, textAlign: 'right', color: '#9aa3b2', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Price</th>
                  <th style={{ padding: 16, textAlign: 'left', color: '#9aa3b2', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Supplier</th>
                  <th style={{ padding: 16, textAlign: 'right', color: '#9aa3b2', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => {
                  const isLowStock = item.reorderPoint && item.quantity <= item.reorderPoint;
                  return (
                    <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: 16 }}>
                        <div>
                          <div style={{ color: '#e5e7eb', fontWeight: 600 }}>{item.name}</div>
                          {item.sku && <div style={{ color: '#9aa3b2', fontSize: 12 }}>SKU: {item.sku}</div>}
                        </div>
                      </td>
                      <td style={{ padding: 16, color: '#e5e7eb' }}>{item.type}</td>
                      <td style={{ padding: 16, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          {isLowStock && <span style={{ color: '#ef4444' }}>⚠️</span>}
                          <span style={{ color: isLowStock ? '#ef4444' : '#e5e7eb', fontWeight: 600 }}>
                            {item.quantity}
                          </span>
                          {item.reorderPoint && (
                            <span style={{ color: '#9aa3b2', fontSize: 12 }}>
                              / {item.reorderPoint}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: 16, textAlign: 'right', color: '#e5e7eb', fontWeight: 600 }}>
                        ${item.price.toFixed(2)}
                      </td>
                      <td style={{ padding: 16, color: '#9aa3b2' }}>{item.supplier || '—'}</td>
                      <td style={{ padding: 16, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(item)}
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
                            onClick={() => handleDelete(item.id)}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                maxWidth: 600,
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ color: '#fff', marginBottom: 24 }}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Item Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

                  <div>
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Type *</label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      placeholder="e.g., Oil, Filter, Part"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
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
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      min="0"
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
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
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
                    <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Reorder Point</label>
                    <input
                      type="number"
                      value={formData.reorderPoint}
                      onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                      min="0"
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
                  <label style={{ color: '#9aa3b2', display: 'block', marginBottom: 8 }}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    {editingItem ? 'Update Item' : 'Add Item'}
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
