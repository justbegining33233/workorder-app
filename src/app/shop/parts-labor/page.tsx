'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

// Category color palettes
const CATEGORY_COLORS: Record<string, { accent: string; bandBg: string; rowBg: string }> = {
  gas: { accent: '#3b82f6', bandBg: 'rgba(59,130,246,0.08)', rowBg: 'rgba(59,130,246,0.06)' },
  diesel: { accent: '#22c55e', bandBg: 'rgba(34,197,94,0.08)', rowBg: 'rgba(34,197,94,0.06)' },
  'small-engine': { accent: '#a855f7', bandBg: 'rgba(168,85,247,0.10)', rowBg: 'rgba(168,85,247,0.08)' },
  resurfacing: { accent: '#f97316', bandBg: 'rgba(249,115,22,0.12)', rowBg: 'rgba(249,115,22,0.08)' },
  welding: { accent: '#ef4444', bandBg: 'rgba(239,68,68,0.12)', rowBg: 'rgba(239,68,68,0.08)' },
  'heavy-equipment': { accent: '#eab308', bandBg: 'rgba(234,179,8,0.14)', rowBg: 'rgba(234,179,8,0.10)' },
  tire: { accent: '#06b6d4', bandBg: 'rgba(6,182,212,0.12)', rowBg: 'rgba(6,182,212,0.08)' },
  general: { accent: '#f59e0b', bandBg: 'rgba(245,158,11,0.12)', rowBg: 'rgba(245,158,11,0.08)' },
};

const getCategoryPalette = (category: string) => {
  const key = (category || 'general').toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.general;
};

type Part = {
  id: string;
  name: string;
  stock: number;
  reorderLevel: number;
  price: number;
  cost: number;
  category: string;
};

type LaborRate = {
  id: string;
  name: string;
  rate: number;
  serviceType?: 'gas' | 'diesel';
};

export default function PartsAndLabor() {

  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['shop']);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState<'parts' | 'labor'>('parts');
  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddLabor, setShowAddLabor] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [editingLabor, setEditingLabor] = useState<LaborRate | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  // Remove inventory-based labor rates, use shop services only
  const [newPart, setNewPart] = useState({ name: '', stock: 0, reorderLevel: 0, price: 0, cost: 0, category: '' });
  const [newLabor, setNewLabor] = useState<{ name: string; rate: number; serviceType?: 'gas' | 'diesel' }>({ name: '', rate: 0 });
  // Service list comes from shop services chosen at signup
  const [availableServices, setAvailableServices] = useState<{name: string; category: string}[]>([]);
  const [pendingServiceRates, setPendingServiceRates] = useState<Record<string, string>>({});
  const [selectedGasServices, setSelectedGasServices] = useState<string[]>([]);
  const [selectedDieselServices, setSelectedDieselServices] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);

  const getCsrf = () => {
    if (typeof document === 'undefined') return '';
    const m = document.cookie.match("(?:^|; )csrf_token=([^;]+)");
    return m ? decodeURIComponent(m[1]) : '';
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const buildHeaders = (csrf: string, includeJson = false): Record<string, string> => {
    const headers: Record<string, string> = { 'X-CSRF-Token': csrf, ...getAuthHeaders() };
    if (includeJson) headers['Content-Type'] = 'application/json';
    return headers;
  };

  // Load labor rates from shop services
  const loadLaborRates = async () => {
    try {
      const shopId = localStorage.getItem('shopId') || user?.shopId;
      if (!shopId) return;
      const response = await fetch(`/api/shops/settings?shopId=${shopId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Map shop services to laborRates format
        const rates = (data.shop.services || [])
          .filter((s: any) => s.price)
          .map((s: any) => ({
            id: s.id,
            name: s.serviceName,
            rate: s.price,
            serviceType: s.category,
          }));
        setLaborRates(rates);

        // Build available services list from saved shop services (what was chosen at signup)
        const unique: Record<string, { name: string; category: string }> = {};
        (data.shop.services || []).forEach((s: any) => {
          const key = `${s.category || 'general'}|${s.serviceName}`;
          if (!unique[key]) {
            unique[key] = { name: s.serviceName, category: s.category || 'general' };
          }
        });
        setAvailableServices(Object.values(unique));
      }
    } catch (error) {
      console.error('Error loading labor rates:', error);
    }
  };

  useEffect(() => {
    if (user?.name) setUserName(user.name);
    loadLaborRates();
     
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e5e7eb',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

  // Save selected services to API
  const handleSaveServices = async () => {
    setSavingServices(true);
    try {
      const csrf = getCsrf();
      const response = await fetch('/api/shops/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({
          gasServices: selectedGasServices,
          dieselServices: selectedDieselServices,
        }),
        credentials: 'include',
      });
      if (response.ok) {
        alert('Services updated!');
      } else {
        alert('Failed to update services');
      }
    } catch (error) {
      alert('Error updating services');
    }
    setSavingServices(false);
  };

  // Remove inventory loading for labor rates

  const handleAddPart = () => {
    const part: Part = {
      id: `P-${String(parts.length + 1).padStart(3, '0')}`,
      ...newPart
    };
    setParts([...parts, part]);
    setNewPart({ name: '', stock: 0, reorderLevel: 0, price: 0, cost: 0, category: '' });
    setShowAddPart(false);
  };

  const handleAddLabor = async () => {
    if (!newLabor.name.trim() || newLabor.rate <= 0) {
      alert('Please enter a valid service name and rate');
      return;
    }
    try {
                              const shopId = localStorage.getItem('shopId') || user?.shopId;
      if (!shopId) {
        alert('Shop ID not found. Please log in again.');
        return;
      }
      const csrf = getCsrf();
      const headers = buildHeaders(csrf, true);
      const response = await fetch('/api/shops/services', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shopId,
          serviceName: newLabor.name,
          category: newLabor.serviceType || 'gas',
          price: newLabor.rate,
        }),
        credentials: 'include',
      });
      if (response.ok) {
        await loadLaborRates();
        setNewLabor({ name: '', rate: 0 });
        setShowAddLabor(false);
        alert('Labor rate added successfully!');
      } else {
        alert('Failed to add labor rate');
      }
    } catch (error) {
      console.error('Error adding labor rate:', error);
      alert('Error adding labor rate');
    }
  };

  const handleUpdatePart = () => {
    if (!editingPart) return;
    setParts(parts.map(p => p.id === editingPart.id ? editingPart : p));
    setEditingPart(null);
  };

  const handleUpdateLabor = async () => {
    if (!editingLabor) return;
    try {
      const csrf = getCsrf();
      const headers = buildHeaders(csrf, true);
      const response = await fetch('/api/shops/services', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          serviceId: editingLabor.id,
          price: editingLabor.rate,
        }),
        credentials: 'include',
      });
      if (response.ok) {
        await loadLaborRates();
        setEditingLabor(null);
        alert('Labor rate updated successfully!');
      } else {
        alert('Failed to update labor rate');
      }
    } catch (error) {
      console.error('Error updating labor rate:', error);
      alert('Error updating labor rate');
    }
  };

  const handleDeletePart = (id: string) => {
    if (confirm('Are you sure you want to delete this part?')) {
      setParts(parts.filter(p => p.id !== id));
    }
  };

  const handleDeleteLabor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this labor rate?')) return;
    try {
      const csrf = getCsrf();
      const headers = buildHeaders(csrf);
      const response = await fetch(`/api/shops/services?serviceId=${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (response.ok) {
        await loadLaborRates();
        alert('Labor rate deleted successfully!');
      } else {
        alert('Failed to delete labor rate');
      }
    } catch (error) {
      console.error('Error deleting labor rate:', error);
      alert('Error deleting labor rate');
    }
  };

  const getStockStatus = (stock: number, reorder: number) => {
    if (stock === 0) return { text: 'OUT OF STOCK', color: '#e5332a' };
    if (stock <= reorder) return { text: 'LOW STOCK', color: '#f59e0b' };
    return { text: 'IN STOCK', color: '#22c55e' };
  };

  const partCategories = [...new Set(parts.map(p => p.category))];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/shop/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Shop Dashboard
          </Link>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🔧 Parts and Set Labor</h1>
              <p style={{fontSize:14, color:'#9aa3b2'}}>Manage inventory parts pricing and labor rates</p>
            </div>
            <div style={{display:'flex', gap:12}}>
              <button 
                onClick={() => activeTab === 'parts' ? setShowAddPart(true) : setShowAddLabor(true)}
                style={{padding:'10px 20px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                + Add {activeTab === 'parts' ? 'Part' : 'Labor Rate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Tab Navigation */}
        <div style={{display:'flex', gap:8, marginBottom:32}}>
          <button 
            onClick={() => setActiveTab('parts')}
            style={{flex:1, padding:'16px', background:activeTab === 'parts' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color:activeTab === 'parts' ? '#3b82f6' : '#9aa3b2', border:`1px solid ${activeTab === 'parts' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer'}}
          >
            📦 Parts Inventory ({parts.length})
          </button>
          <button 
            onClick={() => setActiveTab('labor')}
            style={{flex:1, padding:'16px', background:activeTab === 'labor' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color:activeTab === 'labor' ? '#22c55e' : '#9aa3b2', border:`1px solid ${activeTab === 'labor' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer'}}
          >
            ⏱️ Labor Rates ({laborRates.length})
          </button>
        </div>

        {/* Parts Inventory Tab */}
        {activeTab === 'parts' && (
          <div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
              {parts.map(part => {
                const status = getStockStatus(part.stock, part.reorderLevel);
                const margin = ((part.price - part.cost) / part.price * 100).toFixed(1);
                return (
                  <div key={part.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:20}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                      <div>
                        <span style={{padding:'4px 8px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', borderRadius:6, fontSize:10, fontWeight:600}}>
                          {part.category}
                        </span>
                        <h3 style={{fontSize:16, fontWeight:700, color:'#e5e7eb', marginTop:8}}>{part.name}</h3>
                        <p style={{fontSize:11, color:'#6b7280', marginTop:4}}>{part.id}</p>
                      </div>
                      <span style={{padding:'4px 10px', background:`rgba(${parseInt(status.color.slice(1,3),16)},${parseInt(status.color.slice(3,5),16)},${parseInt(status.color.slice(5,7),16)},0.2)`, color:status.color, borderRadius:6, fontSize:10, fontWeight:700}}>
                        {status.text}
                      </span>
                    </div>

                    <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:12, marginBottom:12}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                        <div>
                          <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Stock</div>
                          <div style={{fontSize:20, fontWeight:700, color:status.color}}>{part.stock}</div>
                        </div>
                        <div>
                          <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Reorder At</div>
                          <div style={{fontSize:20, fontWeight:700, color:'#f59e0b'}}>{part.reorderLevel}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12}}>
                      <div>
                        <div style={{fontSize:10, color:'#9aa3b2', marginBottom:2}}>Cost</div>
                        <div style={{fontSize:13, fontWeight:700, color:'#e5e7eb'}}>${part.cost}</div>
                      </div>
                      <div>
                        <div style={{fontSize:10, color:'#9aa3b2', marginBottom:2}}>Price</div>
                        <div style={{fontSize:13, fontWeight:700, color:'#22c55e'}}>${part.price}</div>
                      </div>
                      <div>
                        <div style={{fontSize:10, color:'#9aa3b2', marginBottom:2}}>Margin</div>
                        <div style={{fontSize:13, fontWeight:700, color:'#3b82f6'}}>{margin}%</div>
                      </div>
                    </div>

                    <div style={{display:'flex', gap:8}}>
                      <button onClick={() => setEditingPart(part)} style={{flex:1, padding:'8px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                        Edit
                      </button>
                      <button onClick={() => handleDeletePart(part.id)} style={{flex:1, padding:'8px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Labor Rates Tab */}
        {activeTab === 'labor' && (
          <div>
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden', marginBottom:32}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                    <th style={{padding:'16px', textAlign:'left', fontSize:12, color:'#9aa3b2', fontWeight:700}}>NAME</th>
                    <th style={{padding:'16px', textAlign:'left', fontSize:12, color:'#9aa3b2', fontWeight:700}}>RATE</th>
                    <th style={{padding:'16px', textAlign:'center', fontSize:12, color:'#9aa3b2', fontWeight:700}}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set([
                    ...availableServices.map(s => s.category || 'general'),
                    ...laborRates.map(lr => lr.serviceType || 'general')
                  ])).map((rawCategory) => {
                    const category = (rawCategory || 'general').toString().trim().toLowerCase();
                    const palette = getCategoryPalette(category);
                    const { accent, bandBg, rowBg } = palette;
                    const displayName = category === 'diesel' ? 'Diesel Services' : category === 'gas' ? 'Gas Services' : `${category.charAt(0).toUpperCase()}${category.slice(1)} Services`;

                    const existing = laborRates.filter(lr => ((lr.serviceType || 'general').toString().trim().toLowerCase()) === category);
                    const available = availableServices.filter(s => ((s.category || 'general').toString().trim().toLowerCase()) === category);

                    return (
                      <>
                        <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                          <td colSpan={3} style={{padding:'12px 16px', background:bandBg}}>
                            <div style={{fontSize:13, fontWeight:700, color:accent}}>{displayName}</div>
                          </td>
                        </tr>

                        {existing.map(labor => (
                          <tr key={labor.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)', background:rowBg}}>
                            <td style={{padding:'16px'}}>
                              <div style={{fontSize:14, fontWeight:700, color:'#e5e7eb'}}>{labor.name}</div>
                              <div style={{fontSize:11, color:'#6b7280', marginTop:4}}>{labor.id}</div>
                            </td>
                            <td style={{padding:'16px', textAlign:'center', fontSize:14, fontWeight:700, color:accent}}>
                              ${labor.rate}
                            </td>
                            <td style={{padding:'16px'}}>
                              <div style={{display:'flex', gap:8, justifyContent:'center'}}>
                                <button onClick={() => setEditingLabor(labor)} style={{padding:'6px 12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer'}}>
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteLabor(labor.id)} style={{padding:'6px 12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer'}}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {available.map((service) => {
                          const alreadyAdded = laborRates.some(lr => lr.name === service.name && (lr.serviceType || 'general') === category);
                          if (alreadyAdded) return null;

                          const key = `${service.category}-${service.name}`;
                          const pendingValue = typeof pendingServiceRates[key] !== 'undefined' ? pendingServiceRates[key] : "";

                          return (
                            <tr key={key} style={{borderBottom:'1px solid rgba(255,255,255,0.05)', background:rowBg}}>
                              <td style={{padding:'16px'}}>
                                <div style={{fontSize:14, fontWeight:700, color:accent}}>{service.name}</div>
                                <div style={{fontSize:11, color:'#6b7280', marginTop:4}}>{service.category || 'General'}</div>
                              </td>
                              <td style={{padding:'16px', textAlign:'center', fontSize:14, fontWeight:700, color:accent}}>
                                <input
                                  type="number"
                                  placeholder="Rate ($)"
                                  style={{width:80, padding:4, borderRadius:6, border:`1px solid ${accent}`, background:'rgba(255,255,255,0.05)', color:'#e5e7eb'}}
                                  value={pendingValue}
                                  onChange={e => setPendingServiceRates(r => ({...r, [key]: e.target.value}))}
                                />
                              </td>
                              <td style={{padding:'16px', textAlign:'center'}}>
                                <button
                                  style={{padding:'6px 12px', background:`${accent}33`, color:accent, border:`1px solid ${accent}55`, borderRadius:6, fontSize:11, fontWeight:600, cursor:!pendingValue ? 'not-allowed' : 'pointer'}}
                                  disabled={!pendingValue}
                                  onClick={async () => {
                                    if (!pendingValue) return;
                                    const csrf = getCsrf();
                                    const shopId = localStorage.getItem('shopId') || user?.shopId;
                                    if (!shopId) {
                                      alert('Shop ID not found. Please log in again.');
                                      return;
                                    }
                                    const headers = buildHeaders(csrf, true);
                                    const serviceRes = await fetch('/api/shops/services', {
                                      method: 'POST',
                                      headers,
                                      body: JSON.stringify({
                                        shopId,
                                        serviceName: service.name,
                                        category: service.category || 'general',
                                        price: Number(pendingValue),
                                      }),
                                      credentials: 'include',
                                    });
                                    if (serviceRes.ok) {
                                      await loadLaborRates();
                                      setPendingServiceRates(r => ({...r, [key]: ''}));
                                      alert('Labor rate added and synced!');
                                    } else {
                                      const error = await serviceRes.json().catch(() => ({}));
                                      alert(error?.error || 'Failed to add labor rate to shop services.');
                                    }
                                  }}
                                >
                                  Add
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Part Modal */}
      {showAddPart && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Add New Part</h2>
            <input type="text" placeholder="Part Name" value={newPart.name} onChange={(e) => setNewPart({...newPart, name: e.target.value})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:12}} />
            <input type="text" placeholder="Category" value={newPart.category} onChange={(e) => setNewPart({...newPart, category: e.target.value})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:12}} />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
              <input type="number" placeholder="Stock" value={newPart.stock || ''} onChange={(e) => setNewPart({...newPart, stock: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
              <input type="number" placeholder="Reorder Level" value={newPart.reorderLevel || ''} onChange={(e) => setNewPart({...newPart, reorderLevel: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
              <input type="number" step="0.01" placeholder="Cost Price" value={newPart.cost || ''} onChange={(e) => setNewPart({...newPart, cost: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
              <input type="number" step="0.01" placeholder="Sell Price" value={newPart.price || ''} onChange={(e) => setNewPart({...newPart, price: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
            </div>
            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setShowAddPart(false)} style={{flex:1, padding:12, background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Cancel</button>
              <button onClick={handleAddPart} style={{flex:1, padding:12, background:'#22c55e', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Add Part</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Part Modal */}
      {editingPart && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Edit Part</h2>
            <input type="text" placeholder="Part Name" value={editingPart.name} onChange={(e) => setEditingPart({...editingPart, name: e.target.value})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:12}} />
            <input type="text" placeholder="Category" value={editingPart.category} onChange={(e) => setEditingPart({...editingPart, category: e.target.value})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:12}} />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
              <input type="number" placeholder="Stock" value={editingPart.stock} onChange={(e) => setEditingPart({...editingPart, stock: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
              <input type="number" placeholder="Reorder Level" value={editingPart.reorderLevel} onChange={(e) => setEditingPart({...editingPart, reorderLevel: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
              <input type="number" step="0.01" placeholder="Cost Price" value={editingPart.cost} onChange={(e) => setEditingPart({...editingPart, cost: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
              <input type="number" step="0.01" placeholder="Sell Price" value={editingPart.price} onChange={(e) => setEditingPart({...editingPart, price: Number(e.target.value)})} style={{padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb'}} />
            </div>
            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setEditingPart(null)} style={{flex:1, padding:12, background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Cancel</button>
              <button onClick={handleUpdatePart} style={{flex:1, padding:12, background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Update Part</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Labor Modal */}
      {showAddLabor && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Add Labor Rate</h2>
            <input type="text" placeholder="Labor Rate Name" value={newLabor.name} onChange={(e) => setNewLabor({...newLabor, name: e.target.value})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:12}} />
            <input type="number" step="5" placeholder="Rate per Hour ($)" value={newLabor.rate || ''} onChange={(e) => setNewLabor({...newLabor, rate: Number(e.target.value)})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:20}} />
            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setShowAddLabor(false)} style={{flex:1, padding:12, background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Cancel</button>
              <button onClick={handleAddLabor} style={{flex:1, padding:12, background:'#22c55e', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Add Labor</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Labor Modal */}
      {editingLabor && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Edit Labor Rate</h2>
            <input type="text" placeholder="Labor Rate Name" value={editingLabor.name} onChange={(e) => setEditingLabor({...editingLabor, name: e.target.value})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:12}} />
            <input type="number" step="5" placeholder="Rate per Hour ($)" value={editingLabor.rate} onChange={(e) => setEditingLabor({...editingLabor, rate: Number(e.target.value)})} style={{width:'100%', padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', marginBottom:20}} />
            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setEditingLabor(null)} style={{flex:1, padding:12, background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Cancel</button>
              <button onClick={handleUpdateLabor} style={{flex:1, padding:12, background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer'}}>Update Labor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
