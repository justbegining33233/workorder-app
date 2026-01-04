'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrderFormData, VehicleType, RepairType, MaintenanceType, TireServiceType, VehicleLocation, ServiceLocationType } from '@/types/workorder';

interface WorkOrderFormProps {
  initialData?: Partial<WorkOrderFormData> & { id?: string };
  onSubmit?: (data: WorkOrderFormData) => void;
  initialServiceLocation?: 'roadside' | 'in-shop';
}




const tireServiceOptions: { value: TireServiceType; label: string }[] = [
  { value: 'flat-repair', label: 'Flat Repair' },
  { value: 'tire-replacement', label: 'Tire Replacement' },
  { value: 'bead-air-leak', label: 'Bead/Air Leak Repair' },
];


export default function WorkOrderForm({ initialData, onSubmit, initialServiceLocation }: WorkOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<'customer' | 'tech' | 'manager'>('customer');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  // Dynamically generated options from shop services (must be inside component)
  const [repairOptions, setRepairOptions] = useState<{ value: string; label: string; category?: string }[]>([]);
  const [maintenanceOptions, setMaintenanceOptions] = useState<{ value: string; label: string; category?: string }[]>([]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || 'customer';
      setUserRole(role as 'customer' | 'tech' | 'manager');
      // Get selected shop from localStorage
      const shopData = localStorage.getItem('selectedShopForService');
      if (shopData) {
        const shop = JSON.parse(shopData);
        setSelectedShop(shop);
        fetchShopProfile(shop.id);
      }
    }
  }, []);

  // When shopProfile changes, update service options
  useEffect(() => {
    if (shopProfile && (shopProfile.gasServices || shopProfile.dieselServices)) {
      const all = [
        ...(shopProfile.gasServices || []),
        ...(shopProfile.dieselServices || [])
      ];
      setRepairOptions(all.map((s: string) => ({ value: s, label: s })));
      setMaintenanceOptions([]);
    }
  }, [shopProfile]);

  const fetchShopProfile = async (shopId: string) => {
    try {
      const response = await fetch(`/api/shops/complete-profile?shopId=${shopId}`, { credentials: 'include' });
      if (response.ok) {
        const profile = await response.json();
        setShopProfile(profile);
        
        // Combine diesel and gas services into available services list
        const services = [
          ...(profile.dieselServices || []),
          ...(profile.gasServices || [])
        ];
        setAvailableServices(services);
      }
    } catch (error) {
      console.error('Error fetching shop profile:', error);
    }
  };

  // Check if a service is available based on shop's offerings
  const isServiceAvailable = (serviceName: string): boolean => {
    // If no shop is selected or user is tech/manager, show all services
    if (!selectedShop || userRole === 'tech' || userRole === 'manager') {
      return true;
    }
    
    // If shop profile not loaded yet, show all
    if (availableServices.length === 0) {
      return true;
    }
    
    // Check if service matches any available service
    return availableServices.some(service => 
      service.toLowerCase().includes(serviceName.toLowerCase()) ||
      serviceName.toLowerCase().includes(service.toLowerCase())
    );
  };
  
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialData?.vehicleType || 'personal-vehicle');
  const [serviceLocationType, setServiceLocationType] = useState<'roadside' | 'in-shop'>(initialServiceLocation || 'roadside');
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>(initialData?.services?.repairs?.map(r => r.type) || []);
  const [repairDetails, setRepairDetails] = useState<Record<string, string>>(
    initialData?.services?.repairs?.reduce((acc, r) => ({...acc, [r.type]: r.description || ''}), {}) || {}
  );
  const [selectedMaintenance, setSelectedMaintenance] = useState<string[]>(initialData?.services?.maintenance?.map(m => m.type) || []);
  const [oilSupplied, setOilSupplied] = useState(initialData?.services?.maintenance?.[0]?.oilSupplied ?? false);
  const [techBringOil, setTechBringOil] = useState(initialData?.services?.maintenance?.[0]?.techBringOil ?? false);
  const [vehicleGreased, setVehicleGreased] = useState(initialData?.services?.maintenance?.[0]?.vehicleGreased ?? false);
  const [tireServiceType, setTireServiceType] = useState<TireServiceType | ''>('');
  
  const [customerProvidesParts, setCustomerProvidesParts] = useState(initialData?.partsMaterials?.customerProvided ?? false);
  const [techBringsParts, setTechBringsParts] = useState(initialData?.partsMaterials?.techBringParts ?? false);
  const [partNotes, setPartNotes] = useState(initialData?.partsMaterials?.notes || '');
  const [partNumbers, setPartNumbers] = useState(initialData?.partsMaterials?.partNumbers || '');
  
  const [symptoms, setSymptoms] = useState(initialData?.issueDescription?.symptoms || '');
  const [pictures, setPictures] = useState<File[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.issueDescription?.additionalNotes || '');
  
  const [locationType, setLocationType] = useState<'geolocation' | 'address' | 'not-provided'>('not-provided');
  const [latitude, setLatitude] = useState<number | null>(initialData?.vehicleLocation?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.vehicleLocation?.longitude || null);
  const [address, setAddress] = useState(initialData?.vehicleLocation?.address || '');
  const [city, setCity] = useState(initialData?.vehicleLocation?.city || '');
  const [state, setState] = useState(initialData?.vehicleLocation?.state || '');
  const [zipCode, setZipCode] = useState(initialData?.vehicleLocation?.zipCode || '');
  const [geoError, setGeoError] = useState<string | null>(null);
  
  const [vin, setVin] = useState(initialData?.vinPhoto?.vin || '');
  const [vinPhoto, setVinPhoto] = useState<File | null>(null);

  const handleRepairToggle = (repair: string) => {
    setSelectedRepairs(prev =>
      prev.includes(repair) ? prev.filter(r => r !== repair) : [...prev, repair]
    );
  };

  const handleMaintenanceToggle = (maintenance: string) => {
    setSelectedMaintenance(prev =>
      prev.includes(maintenance) ? prev.filter(m => m !== maintenance) : [...prev, maintenance]
    );
  };

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPictures([...pictures, ...files]);
  };

  const removePicture = (index: number) => {
    setPictures(pictures.filter((_, i) => i !== index));
  };

  const handleVinPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVinPhoto(file);
  };

  const handleGetGeolocation = () => {
    setGeoError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationType('geolocation');
        },
        (error) => {
          setGeoError(`Error: ${error.message}`);
        }
      );
    } else {
      setGeoError('Geolocation is not supported by your browser');
    }
  };

  const totalSteps = userRole === 'customer' ? 5 : 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const formData: WorkOrderFormData = {
        shopId: selectedShop?.id,
        vehicleType,
        serviceLocationType: (userRole === 'tech' || userRole === 'manager') ? serviceLocationType : undefined,
        services: {
          repairs: selectedRepairs.map(type => ({
            type: type as RepairType,
            description: repairDetails[type],
          })),
          maintenance: selectedMaintenance.map(type => ({
            type: type as MaintenanceType,
            oilSupplied: type === 'oil-change' ? oilSupplied : undefined,
            techBringOil: type === 'oil-change' ? techBringOil : undefined,
            vehicleGreased: ['semi-truck', 'trailer'].includes(vehicleType) && type === 'oil-change' ? vehicleGreased : undefined,
            tireServiceType: type === 'tire-service' ? (tireServiceType as TireServiceType) : undefined,
          })),
        },
        partsMaterials: {
          customerProvided: customerProvidesParts,
          techBringParts: techBringsParts,
          notes: partNotes,
          partNumbers,
        },
        issueDescription: {
          symptoms,
          pictures: pictures.map(p => p.name),
          additionalNotes,
        },
        vehicleLocation: {
          locationType,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          zipCode: zipCode || undefined,
        },
        vinPhoto: {
          vin,
          vinPhotoPath: vinPhoto?.name,
        },
      };

      const url = initialData?.id ? `/api/workorders/${initialData.id}` : '/api/workorders';
      const method = initialData?.id ? 'PUT' : 'POST';

      // Include credentials and CSRF token for cookie-based sessions
      const csrf = (typeof window !== 'undefined') ? document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1] : null;
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save work order');

      if (onSubmit) {
        onSubmit(formData);
      } else {
        // Redirect based on user role
        if (userRole === 'customer') {
          router.push('/customer/home');
        } else if (userRole === 'tech') {
          router.push('/tech/home');
        } else if (userRole === 'manager') {
          router.push('/manager/home');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving work order:', error);
      alert('Failed to save work order');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: '#e5e7eb',
    fontSize: 14,
  };

  const checkboxCardStyle = (checked: boolean) => ({
    display: 'flex',
    alignItems: 'start',
    padding: 16,
    border: checked ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.2)',
    borderRadius: 12,
    background: checked ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <form onSubmit={handleSubmit} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:32}}>
      {/* Selected Shop Banner */}
      {selectedShop && userRole === 'customer' && (
        <div style={{marginBottom:24, padding:16, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12}}>
          <div style={{fontSize:14, fontWeight:600, color:'#3b82f6', marginBottom:4}}>Requesting Service From:</div>
          <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>{selectedShop.shopName || selectedShop.name}</div>
          <div style={{fontSize:13, color:'#9aa3b2', marginTop:4}}>
            {selectedShop.location} • {selectedShop.distance} mi away
          </div>
          {availableServices.length > 0 && (
            <div style={{fontSize:12, color:'#60a5fa', marginTop:8}}>
              ✓ Only services offered by this shop are shown below
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div style={{marginBottom:40}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb'}}>
            {userRole === 'customer' ? 'Submit Service Request' : 'Work Order Management'}
          </h1>
          <span style={{fontSize:13, fontWeight:600, color:'#9aa3b2', background:'rgba(255,255,255,0.1)', padding:'8px 16px', borderRadius:8}}>
            Step {step} of {totalSteps}
          </span>
        </div>
        <div style={{width:'100%', background:'rgba(0,0,0,0.3)', borderRadius:999, height:12}}>
          <div
            style={{
              background:'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
              height:12,
              borderRadius:999,
              width:`${(step / totalSteps) * 100}%`,
              transition:'width 0.3s'
            }}
          />
        </div>
      </div>

      {/* Step 1: Vehicle Type */}
      {step === 1 && (
        <div>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Vehicle Type</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
            {[
              { value: 'semi-truck', label: 'Semi Truck' },
              { value: 'trailer', label: 'Trailer' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'personal-vehicle', label: 'Personal Vehicle' },
            ].map(option => (
              <label key={option.value} style={checkboxCardStyle(vehicleType === option.value)}>
                <input
                  type="radio"
                  name="vehicleType"
                  value={option.value}
                  checked={vehicleType === option.value}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  style={{width:20, height:20, accentColor:'#3b82f6', marginTop:2}}
                />
                <span style={{marginLeft:12, fontWeight:600, color:'#e5e7eb'}}>{option.label}</span>
              </label>
            ))}
          </div>

          {/* Service Location Type - Only for Tech/Manager */}
          {(userRole === 'tech' || userRole === 'manager') && (
            <div style={{marginTop:32}}>
              <h3 style={{fontSize:18, fontWeight:600, color:'#e5e7eb', marginBottom:16}}>Service Location</h3>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16}}>
                {[
                  { value: 'roadside', label: 'Roadside / Mobile Service', description: 'Service performed at customer location' },
                  { value: 'in-shop', label: 'In-Shop Service', description: 'Customer brings vehicle to shop' },
                ].map(option => (
                  <label key={option.value} style={checkboxCardStyle(serviceLocationType === option.value)}>
                    <input
                      type="radio"
                      name="serviceLocationType"
                      value={option.value}
                      checked={serviceLocationType === option.value}
                      onChange={(e) => setServiceLocationType(e.target.value as 'roadside' | 'in-shop')}
                      style={{width:20, height:20, accentColor:'#3b82f6', marginTop:2}}
                    />
                    <div style={{marginLeft:12}}>
                      <div style={{fontWeight:600, color:'#e5e7eb'}}>{option.label}</div>
                      <div style={{fontSize:12, color:'#9aa3b2', marginTop:4}}>{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:32}}>Service Requirements</h2>
          {repairOptions.length === 0 ? (
            <div style={{color:'#f87171', background:'rgba(239,68,68,0.08)', border:'1px solid #f87171', borderRadius:8, padding:24, marginBottom:32, textAlign:'center', fontWeight:600}}>
              No services are available for this shop. Please contact the shop or select a different shop to continue.
            </div>
          ) : (
            <div style={{marginBottom:40}}>
              <h3 style={{fontSize:18, fontWeight:600, color:'#e5e7eb', marginBottom:16}}>Repairs Needed</h3>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
                {repairOptions.map(option => (
                  <div key={option.value}>
                    <label style={checkboxCardStyle(selectedRepairs.includes(option.value))}>
                      <input
                        type="checkbox"
                        checked={selectedRepairs.includes(option.value)}
                        onChange={() => handleRepairToggle(option.value)}
                        style={{width:20, height:20, accentColor:'#3b82f6', marginTop:2}}
                      />
                      <div style={{marginLeft:12}}>
                        <div style={{fontWeight:600, color:'#e5e7eb'}}>{option.label}</div>
                        {userRole === 'customer' && option.value === 'other-repair' && (
                          <div style={{fontSize:11, color:'#9aa3b2', marginTop:2}}>Describe below</div>
                        )}
                      </div>
                    </label>
                    {selectedRepairs.includes(option.value) && option.value === 'other-repair' && (
                      <input
                        type="text"
                        placeholder="Describe the repair needed"
                        value={repairDetails['other-repair'] || ''}
                        onChange={(e) => setRepairDetails({...repairDetails, 'other-repair': e.target.value})}
                        style={{...inputStyle, marginTop:8}}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 style={{fontSize:18, fontWeight:600, color:'#e5e7eb', marginBottom:16}}>Maintenance Services</h3>
            {maintenanceOptions.length === 0 ? (
              <div style={{color:'#f87171', background:'rgba(239,68,68,0.08)', border:'1px solid #f87171', borderRadius:8, padding:24, marginBottom:32, textAlign:'center', fontWeight:600}}>
                No maintenance services are available for this shop.
              </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
                {maintenanceOptions.map(option => (
                  <div key={option.value}>
                    <label style={checkboxCardStyle(selectedMaintenance.includes(option.value))}>
                      <input
                        type="checkbox"
                        checked={selectedMaintenance.includes(option.value)}
                        onChange={() => handleMaintenanceToggle(option.value)}
                        style={{width:20, height:20, accentColor:'#3b82f6', marginTop:2}}
                      />
                      <div style={{marginLeft:12}}>
                        <div style={{fontWeight:600, color:'#e5e7eb'}}>{option.label}</div>
                      </div>
                    </label>

                    {selectedMaintenance.includes('oil-change') && option.value === 'oil-change' && (
                      <div style={{marginLeft:16, marginTop:12, padding:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8}}>
                        <label style={{display:'flex', alignItems:'center', marginBottom:12}}>
                          <input
                            type="checkbox"
                            checked={oilSupplied}
                            onChange={(e) => setOilSupplied(e.target.checked)}
                            style={{width:16, height:16, accentColor:'#3b82f6'}}
                          />
                          <span style={{marginLeft:12, fontSize:14, fontWeight:500, color:'#e5e7eb'}}>Will you supply the oil & filter?</span>
                        </label>
                        <label style={{display:'flex', alignItems:'center', marginBottom:12}}>
                          <input
                            type="checkbox"
                            checked={techBringOil}
                            onChange={(e) => setTechBringOil(e.target.checked)}
                            style={{width:16, height:16, accentColor:'#3b82f6'}}
                          />
                          <span style={{marginLeft:12, fontSize:14, fontWeight:500, color:'#e5e7eb'}}>Should the tech bring oil & filter?</span>
                        </label>
                        {['semi-truck', 'trailer'].includes(vehicleType) && (
                          <label style={{display:'flex', alignItems:'center'}}>
                            <input
                              type="checkbox"
                              checked={vehicleGreased}
                              onChange={(e) => setVehicleGreased(e.target.checked)}
                              style={{width:16, height:16, accentColor:'#3b82f6'}}
                            />
                            <span style={{marginLeft:12, fontSize:14, fontWeight:500, color:'#e5e7eb'}}>Do you want the vehicle greased?</span>
                          </label>
                        )}
                      </div>
                    )}

                    {selectedMaintenance.includes('tire-service') && option.value === 'tire-service' && (
                      <div style={{marginLeft:16, marginTop:12, padding:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8}}>
                        {tireServiceOptions.map(tso => (
                          <label key={tso.value} style={{display:'flex', alignItems:'center', marginBottom:8}}>
                            <input
                              type="radio"
                              name="tireServiceType"
                              value={tso.value}
                              checked={tireServiceType === tso.value}
                              onChange={(e) => setTireServiceType(e.target.value as TireServiceType)}
                              style={{width:16, height:16, accentColor:'#3b82f6'}}
                            />
                            <span style={{marginLeft:12, fontSize:14, fontWeight:500, color:'#e5e7eb'}}>{tso.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Symptoms */}
      {step === (userRole === 'customer' ? 3 : 5) && (
        <div>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Issue Description</h2>
          <div style={{marginBottom:24}}>
            <label style={{display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:8}}>
              Describe the symptoms
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="What symptoms is the vehicle exhibiting?"
              required
              style={{...inputStyle, minHeight:120, resize:'vertical'}}
            />
          </div>

          <div style={{marginBottom:24}}>
            <label style={{display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:8}}>
              Upload pictures (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePictureUpload}
              style={{...inputStyle, padding:12}}
            />
            {pictures.length > 0 && (
              <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:12}}>
                {pictures.map((pic, idx) => (
                  <div key={idx} style={{position:'relative', background:'rgba(0,0,0,0.2)', padding:8, borderRadius:8}}>
                    <div style={{fontSize:12, color:'#e5e7eb', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{pic.name}</div>
                    <button
                      type="button"
                      onClick={() => removePicture(idx)}
                      style={{padding:'4px 8px', background:'#e5332a', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:11}}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:8}}>
              Additional notes (optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any other details we should know?"
              style={{...inputStyle, minHeight:100, resize:'vertical'}}
            />
          </div>
        </div>
      )}

      {/* Step 4: Vehicle Location */}
      {step === (userRole === 'customer' ? 4 : 8) && (
        <div>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Vehicle Location</h2>
          
          <div style={{marginBottom:24}}>
            <button
              type="button"
              onClick={handleGetGeolocation}
              style={{padding:'12px 24px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600, marginRight:16}}
            >
              📍 Use Current Location
            </button>
            <button
              type="button"
              onClick={() => setLocationType('address')}
              style={{padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}
            >
              Enter Address
            </button>
          </div>

          {geoError && (
            <div style={{padding:12, background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, color:'#ff7a59', fontSize:14, marginBottom:16}}>
              {geoError}
            </div>
          )}

          {latitude && longitude && (
            <div style={{padding:16, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, marginBottom:16}}>
              <div style={{fontSize:14, color:'#22c55e', fontWeight:600, marginBottom:4}}>✓ Location captured</div>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}</div>
            </div>
          )}

          {locationType === 'address' && (
            <div style={{display:'grid', gap:16}}>
              <input
                type="text"
                placeholder="Street Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={inputStyle}
              />
              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <input
                type="text"
                placeholder="ZIP Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 5: VIN */}
      {step === (userRole === 'customer' ? 5 : 10) && (
        <div>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>VIN Information</h2>
          
          <div style={{marginBottom:24}}>
            <label style={{display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:8}}>
              VIN Number (optional)
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Enter VIN"
              maxLength={17}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{display:'block', fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:8}}>
              Upload VIN Photo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleVinPhotoUpload}
              style={{...inputStyle, padding:12}}
            />
            {vinPhoto && (
              <div style={{marginTop:12, padding:12, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8}}>
                <div style={{fontSize:14, color:'#22c55e', fontWeight:600}}>✓ Photo uploaded: {vinPhoto.name}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{display:'flex', justifyContent:'space-between', marginTop:40, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.1)'}}>
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            style={{padding:'12px 32px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600}}
          >
            ← Previous
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{padding:'12px 32px', background:'#e5332a', color:'white', border:'none', borderRadius:8, cursor: loading ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:600, marginLeft:'auto'}}
        >
          {step === totalSteps ? (loading ? 'Saving...' : 'Create Work Order') : 'Next →'}
        </button>
      </div>
    </form>
  );
}
