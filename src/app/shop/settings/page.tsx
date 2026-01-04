'use client';

import { useEffect, useState } from 'react';
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

interface Service {
  id: string;
  serviceName: string;
  category: string;
  price: number | null;
  duration?: number | null;
  description?: string | null;
}

export default function ShopSettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [shopId, setShopId] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    serviceName: '',
    category: 'diesel' as 'diesel' | 'gas',
    price: ''
  });
  const [editService, setEditService] = useState({
    price: '',
    duration: '',
    description: ''
  });
  const [settings, setSettings] = useState({
    shopName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    businessLicense: '',
    insurancePolicy: '',
    shopType: 'both',
    operatingHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: true },
    }
  });
  const [notifications, setNotifications] = useState({
    // Parts notifications
    lowInventory: true,
    partsDelivered: true,
    partsOrdered: true,
    // Customer work order notifications
    newRoadCallOrder: true,
    // Payment notifications
    paymentReceived: true,
    // Work order status notifications
    workOrderCreated: true,
    workOrderStarted: true,
    workOrderCompleted: true,
    techArrived: true,
    techLeaving: true,
    estimateApproved: true,
    estimateRejected: true,
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('shopId');
    
    if (role !== 'shop') {
      router.push('/auth/login');
      return;
    }
    
    if (name) setUserName(name);
    if (id) {
      setShopId(id);
      loadSettings(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/shops/settings?shopId=${id}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          shopName: data.shop.shopName || '',
          email: data.shop.email || '',
          phone: data.shop.phone || '',
          address: data.shop.address || '',
          city: data.shop.city || '',
          state: data.shop.state || '',
          zipCode: data.shop.zipCode || '',
          businessLicense: data.shop.businessLicense || '',
          insurancePolicy: data.shop.insurancePolicy || '',
          shopType: data.shop.shopType || 'both',
          operatingHours: {
            monday: { open: '08:00', close: '18:00', closed: false },
            tuesday: { open: '08:00', close: '18:00', closed: false },
            wednesday: { open: '08:00', close: '18:00', closed: false },
            thursday: { open: '08:00', close: '18:00', closed: false },
            friday: { open: '08:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '14:00', closed: false },
            sunday: { open: '09:00', close: '14:00', closed: true },
          }
        });
        setServices(data.shop.services || []);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify({
          shopId,
          ...settings
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleAddService = async () => {
    if (!newService.serviceName.trim()) {
      alert('Please select a service from the dropdown');
      return;
    }

    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/services', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify({
          shopId,
          serviceName: newService.serviceName,
          category: newService.category,
          price: newService.price ? parseFloat(newService.price) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setServices([...services, data.service]);
        setShowAddServiceModal(false);
        setNewService({ serviceName: '', category: 'diesel', price: '' });
        alert('Service added successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add service');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Error adding service');
    }
  };

  const handlePopulateDefaults = async () => {
    if (!shopId) return alert('Shop ID not found');
    const toCreate = [
      ...DIESEL_SERVICES.map(s => ({ serviceName: s, category: 'diesel' })),
      ...GAS_SERVICES.map(s => ({ serviceName: s, category: 'gas' })),
    ];

    let created = 0;
    for (const item of toCreate) {
      try {
        const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
        const res = await fetch('/api/shops/services', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
          body: JSON.stringify({ shopId, serviceName: item.serviceName, category: item.category }),
        });
        if (res.ok) created += 1;
      } catch (e) {
        // ignore individual errors
      }
    }
    alert(`Imported ${created} default services`);
    // reload services
    await loadSettings(shopId);
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to remove this service?')) return;

    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch(`/api/shops/services?serviceId=${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-token': csrf || '' },
      });

      if (response.ok) {
        setServices(services.filter(s => s.id !== serviceId));
        alert('Service removed successfully!');
      } else {
        alert('Failed to remove service');
      }
    } catch (error) {
      console.error('Error removing service:', error);
      alert('Error removing service');
    }
  };

  const handleOpenEditService = (service: Service) => {
    setSelectedService(service);
    setEditService({
      price: service.price?.toString() || '',
      duration: service.duration ? (service.duration / 60).toString() : '', // Convert minutes to hours for display
      description: service.description || ''
    });
    setShowEditServiceModal(true);
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    try {
      const csrf = typeof document !== 'undefined' ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch('/api/shops/services', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          price: editService.price ? parseFloat(editService.price) : null,
          duration: editService.duration ? Math.round(parseFloat(editService.duration) * 60) : null, // Convert hours to minutes
          description: editService.description || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setServices(services.map(s => s.id === selectedService.id ? data.service : s));
        setShowEditServiceModal(false);
        setSelectedService(null);
        alert('Service updated successfully!');
      } else {
        alert('Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Error updating service');
    }
  };

  const tabs = [
    { id: 'general', icon: '🏢', name: 'General Info' },
    { id: 'hours', icon: '🕐', name: 'Operating Hours' },
    { id: 'services', icon: '🔧', name: 'Services' },
    { id: 'notifications', icon: '🔔', name: 'Notifications' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/shop/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:8, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>⚙️ Shop Settings</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Manage your shop information and preferences</p>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gridTemplateColumns:'250px 1fr', gap:24}}>
          {/* Sidebar */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, height:'fit-content'}}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width:'100%',
                  padding:'12px 16px',
                  marginBottom:8,
                  background: activeTab === tab.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#9aa3b2',
                  border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer',
                  textAlign:'left',
                  display:'flex',
                  alignItems:'center',
                  gap:12
                }}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:32}}>
            {activeTab === 'general' && (
              <div>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>General Information</h2>
                
                <div style={{display:'grid', gap:20}}>
                  <div>
                    <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Shop Name</label>
                    <input type="text" value={settings.shopName} onChange={(e) => setSettings({...settings, shopName: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Email</label>
                      <input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Phone</label>
                      <input type="tel" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                  </div>

                  <div>
                    <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Address</label>
                    <input type="text" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>City</label>
                      <input type="text" value={settings.city} onChange={(e) => setSettings({...settings, city: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>State</label>
                      <input type="text" value={settings.state} onChange={(e) => setSettings({...settings, state: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>ZIP Code</label>
                      <input type="text" value={settings.zipCode} onChange={(e) => setSettings({...settings, zipCode: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Business License</label>
                      <input type="text" value={settings.businessLicense} onChange={(e) => setSettings({...settings, businessLicense: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Insurance Policy</label>
                      <input type="text" value={settings.insurancePolicy} onChange={(e) => setSettings({...settings, insurancePolicy: e.target.value})} style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Operating Hours</h2>
                
                <div style={{display:'grid', gap:16}}>
                  {Object.entries(settings.operatingHours).map(([day, hours]) => (
                    <div key={day} style={{display:'flex', alignItems:'center', gap:16, padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                      <div style={{width:100, fontSize:14, fontWeight:600, color:'#e5e7eb', textTransform:'capitalize'}}>{day}</div>
                      <input
                        type="time"
                        value={hours.open}
                        disabled={hours.closed}
                        onChange={e => {
                          setSettings({
                            ...settings,
                            operatingHours: {
                              ...settings.operatingHours,
                              [day]: { ...hours, open: e.target.value }
                            }
                          });
                        }}
                        style={{padding:'8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:13}}
                      />
                      <span style={{color:'#9aa3b2'}}>to</span>
                      <input
                        type="time"
                        value={hours.close}
                        disabled={hours.closed}
                        onChange={e => {
                          setSettings({
                            ...settings,
                            operatingHours: {
                              ...settings.operatingHours,
                              [day]: { ...hours, close: e.target.value }
                            }
                          });
                        }}
                        style={{padding:'8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'#e5e7eb', fontSize:13}}
                      />
                      <label style={{display:'flex', alignItems:'center', gap:8, marginLeft:'auto', color:'#9aa3b2', cursor:'pointer'}}>
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={e => {
                            setSettings({
                              ...settings,
                              operatingHours: {
                                ...settings.operatingHours,
                                [day]: { ...hours, closed: e.target.checked }
                              }
                            });
                          }}
                          style={{width:18, height:18, cursor:'pointer'}}
                        />
                        Closed
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
                  <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Offered Services</h2>
                  <div style={{display:'flex', gap:12}}>
                    <button 
                      onClick={() => setShowAddServiceModal(true)}
                      style={{padding:'10px 20px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                    >
                      + Add Service
                    </button>
                    <button
                      onClick={handlePopulateDefaults}
                      style={{padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                      title="Import default diesel & gas services"
                    >
                      Import Default Services
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>Loading services...</div>
                ) : services.length === 0 ? (
                  <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
                    <div style={{fontSize:48, marginBottom:16}}>🔧</div>
                    <p style={{marginBottom:16}}>No services configured</p>
                    <button 
                      onClick={() => setShowAddServiceModal(true)}
                      style={{padding:'12px 24px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                    >
                      + Add First Service
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{marginBottom:24}}>
                      <h3 style={{fontSize:16, fontWeight:600, color:'#22c55e', marginBottom:12}}>
                        Diesel / Heavy-Duty Services ({services.filter(s => s.category === 'diesel').length})
                      </h3>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12}}>
                        {services.filter(s => s.category === 'diesel').map(service => (
                          <div 
                            key={service.id} 
                            onClick={() => handleOpenEditService(service)}
                            style={{
                              padding:12, 
                              background:'rgba(34,197,94,0.1)', 
                              border:'1px solid rgba(34,197,94,0.3)', 
                              borderRadius:8, 
                              display:'flex', 
                              justifyContent:'space-between', 
                              alignItems:'center',
                              cursor:'pointer',
                              transition:'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(34,197,94,0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(34,197,94,0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{display:'flex', alignItems:'center', gap:8, flex:1}}>
                              <span style={{color:'#22c55e', fontSize:16}}>✓</span>
                              <div>
                                <div style={{color:'#e5e7eb', fontSize:14, fontWeight:600}}>{service.serviceName}</div>
                                {(service.price || service.duration) && (
                                  <div style={{color:'#9aa3b2', fontSize:11, marginTop:2}}>
                                    {service.price && `$${service.price}`}
                                    {service.price && service.duration && ' • '}
                                    {service.duration && `${(service.duration / 60).toFixed(1)}h`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveService(service.id);
                              }}
                              style={{background:'transparent', border:'none', color:'#e5332a', cursor:'pointer', fontSize:18, padding:4}}
                              title="Remove service"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 style={{fontSize:16, fontWeight:600, color:'#3b82f6', marginBottom:12}}>
                        Gas / Automotive Services ({services.filter(s => s.category === 'gas').length})
                      </h3>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:12}}>
                        {services.filter(s => s.category === 'gas').map(service => (
                          <div 
                            key={service.id} 
                            onClick={() => handleOpenEditService(service)}
                            style={{
                              padding:12, 
                              background:'rgba(59,130,246,0.1)', 
                              border:'1px solid rgba(59,130,246,0.3)', 
                              borderRadius:8, 
                              display:'flex', 
                              justifyContent:'space-between', 
                              alignItems:'center',
                              cursor:'pointer',
                              transition:'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{display:'flex', alignItems:'center', gap:8, flex:1}}>
                              <span style={{color:'#3b82f6', fontSize:16}}>✓</span>
                              <div>
                                <div style={{color:'#e5e7eb', fontSize:14, fontWeight:600}}>{service.serviceName}</div>
                                {(service.price || service.duration) && (
                                  <div style={{color:'#9aa3b2', fontSize:11, marginTop:2}}>
                                    {service.price && `$${service.price}`}
                                    {service.price && service.duration && ' • '}
                                    {service.duration && `${(service.duration / 60).toFixed(1)}h`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveService(service.id);
                              }}
                              style={{background:'transparent', border:'none', color:'#e5332a', cursor:'pointer', fontSize:18, padding:4}}
                              title="Remove service"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Notification Preferences</h2>
                <p style={{color:'#9aa3b2', marginBottom:32}}>Choose which notifications you want to receive</p>

                {/* Parts Notifications */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#f59e0b', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>📦</span> Parts & Inventory
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Low Inventory Alert</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when parts inventory is running low</div>
                      </div>
                      <input type="checkbox" checked={notifications.lowInventory} onChange={() => handleNotificationToggle('lowInventory')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Parts Delivered</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when ordered parts arrive</div>
                      </div>
                      <input type="checkbox" checked={notifications.partsDelivered} onChange={() => handleNotificationToggle('partsDelivered')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Parts Ordered</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when team members order parts</div>
                      </div>
                      <input type="checkbox" checked={notifications.partsOrdered} onChange={() => handleNotificationToggle('partsOrdered')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>

                {/* Customer Work Orders */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#e5332a', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>🚨</span> Customer Work Orders
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>New Road Call Order</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when customers create new roadside assistance requests</div>
                      </div>
                      <input type="checkbox" checked={notifications.newRoadCallOrder} onChange={() => handleNotificationToggle('newRoadCallOrder')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>

                {/* Payment Notifications */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#22c55e', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>💳</span> Payments
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Payment Received</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Get notified when customers make payments</div>
                      </div>
                      <input type="checkbox" checked={notifications.paymentReceived} onChange={() => handleNotificationToggle('paymentReceived')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>

                {/* Work Order Status Updates */}
                <div style={{marginBottom:32}}>
                  <h3 style={{fontSize:16, fontWeight:600, color:'#3b82f6', marginBottom:16, display:'flex', alignItems:'center', gap:8}}>
                    <span>📋</span> Work Order Status Updates
                  </h3>
                  <div style={{display:'grid', gap:12}}>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Work Order Created</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>New work order has been created</div>
                      </div>
                      <input type="checkbox" checked={notifications.workOrderCreated} onChange={() => handleNotificationToggle('workOrderCreated')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Work Started</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Technician has started working on a job</div>
                      </div>
                      <input type="checkbox" checked={notifications.workOrderStarted} onChange={() => handleNotificationToggle('workOrderStarted')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Work Completed</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Work order has been completed</div>
                      </div>
                      <input type="checkbox" checked={notifications.workOrderCompleted} onChange={() => handleNotificationToggle('workOrderCompleted')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Tech Arrived</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Technician has arrived at the location</div>
                      </div>
                      <input type="checkbox" checked={notifications.techArrived} onChange={() => handleNotificationToggle('techArrived')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Tech Leaving</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Technician is leaving the location</div>
                      </div>
                      <input type="checkbox" checked={notifications.techLeaving} onChange={() => handleNotificationToggle('techLeaving')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Estimate Approved</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Customer has approved an estimate</div>
                      </div>
                      <input type="checkbox" checked={notifications.estimateApproved} onChange={() => handleNotificationToggle('estimateApproved')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                    <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                      <div>
                        <div style={{color:'#e5e7eb', fontWeight:600, marginBottom:4}}>Estimate Rejected</div>
                        <div style={{color:'#9aa3b2', fontSize:13}}>Customer has rejected an estimate</div>
                      </div>
                      <input type="checkbox" checked={notifications.estimateRejected} onChange={() => handleNotificationToggle('estimateRejected')} style={{width:20, height:20, cursor:'pointer'}} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div style={{marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <button onClick={handleSave} style={{padding:'12px 32px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Add New Service</h2>
              <button onClick={() => setShowAddServiceModal(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Service Category *</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <button 
                  type="button" 
                  onClick={() => setNewService({...newService, category: 'diesel', serviceName: ''})} 
                  style={{
                    padding:16, 
                    background:newService.category === 'diesel' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', 
                    border:`2px solid ${newService.category === 'diesel' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, 
                    borderRadius:8, 
                    cursor:'pointer', 
                    color:'#e5e7eb', 
                    fontSize:14, 
                    fontWeight:600
                  }}
                >
                  <div style={{fontSize:24, marginBottom:8}}>🚛</div>
                  Diesel / Heavy-Duty
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewService({...newService, category: 'gas', serviceName: ''})} 
                  style={{
                    padding:16, 
                    background:newService.category === 'gas' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', 
                    border:`2px solid ${newService.category === 'gas' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, 
                    borderRadius:8, 
                    cursor:'pointer', 
                    color:'#e5e7eb', 
                    fontSize:14, 
                    fontWeight:600
                  }}
                >
                  <div style={{fontSize:24, marginBottom:8}}>🚗</div>
                  Gas / Automotive
                </button>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Service Name *</label>
              <select 
                value={newService.serviceName} 
                onChange={(e) => setNewService({...newService, serviceName: e.target.value})} 
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
              >
                <option value="" disabled>Select a service...</option>
                {(newService.category === 'diesel' ? DIESEL_SERVICES : GAS_SERVICES).map(service => (
                  <option key={service} value={service} style={{background:'rgba(0,0,0,0.8)', color:'#e5e7eb'}}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Price (Optional)</label>
              <input 
                type="number" 
                value={newService.price} 
                onChange={(e) => setNewService({...newService, price: e.target.value})} 
                placeholder="0.00"
                step="0.01"
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
            </div>

            <div style={{display:'flex', gap:12}}>
              <button 
                onClick={() => setShowAddServiceModal(false)} 
                style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddService} 
                style={{flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && selectedService && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:600, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <div>
                <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{selectedService.serviceName}</h2>
                <span style={{
                  padding:'4px 12px', 
                  background: selectedService.category === 'diesel' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', 
                  color: selectedService.category === 'diesel' ? '#22c55e' : '#3b82f6', 
                  borderRadius:12, 
                  fontSize:12, 
                  fontWeight:600
                }}>
                  {selectedService.category === 'diesel' ? '🚛 Diesel / Heavy-Duty' : '🚗 Gas / Automotive'}
                </span>
              </div>
              <button onClick={() => setShowEditServiceModal(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <p style={{color:'#9aa3b2', marginBottom:24, fontSize:14}}>Set labor time and pricing for this service</p>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Labor Duration (hours)</label>
              <input 
                type="number" 
                value={editService.duration} 
                onChange={(e) => setEditService({...editService, duration: e.target.value})} 
                placeholder="e.g., 2.5"
                step="0.25"
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
              <div style={{color:'#6b7280', fontSize:12, marginTop:4}}>Estimated time to complete this service</div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Service Price ($)</label>
              <input 
                type="number" 
                value={editService.price} 
                onChange={(e) => setEditService({...editService, price: e.target.value})} 
                placeholder="0.00"
                step="0.01"
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
              <div style={{color:'#6b7280', fontSize:12, marginTop:4}}>Standard pricing for this service (excluding parts)</div>
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Description / Notes</label>
              <textarea 
                value={editService.description} 
                onChange={(e) => setEditService({...editService, description: e.target.value})} 
                placeholder="Add any notes about this service..."
                rows={3}
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14, resize:'vertical'}} 
              />
            </div>

            <div style={{display:'flex', gap:12}}>
              <button 
                onClick={() => setShowEditServiceModal(false)} 
                style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateService} 
                style={{flex:1, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
