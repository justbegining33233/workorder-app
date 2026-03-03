'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createWorkOrderClient } from '@/lib/workordersClient';

const VEHICLE_TYPES = ['Car', 'Truck', 'SUV', 'Van', 'Diesel Truck', 'Semi / 18-Wheeler', 'Box Truck', 'RV', 'Motorcycle', 'Heavy Equipment', 'Other'];

function NewRoadsideJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shopId] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('shopId') || '' : '');
  const [services, setServices] = useState<{ id: string; name: string; category: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleType: 'Car',
    selectedServices: [] as string[],
    locationAddress: '',
    locationLat: '',
    locationLng: '',
    notes: '',
  });

  useEffect(() => {
    if (!shopId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`/api/services?shopId=${shopId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => setServices(data.services || []))
      .catch(() => {});
  }, [shopId]);

  const handleServiceToggle = (name: string) => {
    setForm((f) => ({
      ...f,
      selectedServices: f.selectedServices.includes(name)
        ? f.selectedServices.filter((s) => s !== name)
        : [...f.selectedServices, name],
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setFormError('Geolocation not supported on this device.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        } catch {}
        setForm((f) => ({ ...f, locationAddress: address, locationLat: String(latitude), locationLng: String(longitude) }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFormError('Could not get location. Please enter address manually.');
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.customerName.trim()) { setFormError('Customer name is required.'); return; }
    if (!form.customerPhone.trim()) { setFormError('Customer phone is required.'); return; }
    if (!form.vehicleMake.trim()) { setFormError('Vehicle make is required.'); return; }
    if (form.selectedServices.length === 0) { setFormError('Please select at least one service.'); return; }
    if (!form.locationAddress.trim()) { setFormError('Location is required.'); return; }

    setSubmitting(true);

    const description = [
      `Customer: ${form.customerName}`,
      `Phone: ${form.customerPhone}`,
      `Vehicle: ${form.vehicleYear} ${form.vehicleMake} ${form.vehicleModel} (${form.vehicleType})`,
      `Services: ${form.selectedServices.join(', ')}`,
      `Location: ${form.locationAddress}`,
      form.notes ? `Notes: ${form.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    createWorkOrderClient({
      vehicleType: form.vehicleType.toLowerCase().replace(/\s+/g, '-') as any,
      serviceLocationType: 'roadside',
      services: { repairs: [], maintenance: [] },
      issueDescription: {
        symptoms: form.selectedServices.join(', '),
        pictures: [],
        additionalNotes: description,
      },
      status: 'pending',
      assignedTo: undefined,
      messages: [],
      partLaborBreakdown: { partsUsed: [], laborLines: [], laborHours: 0, additionalCharges: [] },
      estimate: null,
      createdBy: form.customerName,
      customer: {
        firstName: form.customerName,
        lastName: '',
        email: '',
        phone: form.customerPhone,
      },
    });

    router.push('/workorders/list?from=admin');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: 8,
    color: '#e5e7eb',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#9aa3b2',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  };

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1f2937',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#e5e7eb' }}>
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1f2937', padding: '16px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.back()}
            style={{ color: '#3b82f6', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🚗 New Roadside Job</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '2px 0 0' }}>Fill in the details to create a roadside work order</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px' }}>

        {/* Customer Info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', margin: '0 0 16px' }}>👤 Customer Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="John Smith" required />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} placeholder="(555) 123-4567" type="tel" required />
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', margin: '0 0 16px' }}>🚙 Vehicle Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Year</label>
              <input style={inputStyle} value={form.vehicleYear} onChange={(e) => setForm((f) => ({ ...f, vehicleYear: e.target.value }))} placeholder="2021" maxLength={4} />
            </div>
            <div>
              <label style={labelStyle}>Make *</label>
              <input style={inputStyle} value={form.vehicleMake} onChange={(e) => setForm((f) => ({ ...f, vehicleMake: e.target.value }))} placeholder="Ford" required />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input style={inputStyle} value={form.vehicleModel} onChange={(e) => setForm((f) => ({ ...f, vehicleModel: e.target.value }))} placeholder="F-250" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Vehicle Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VEHICLE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, vehicleType: type }))}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: '1px solid',
                    borderColor: form.vehicleType === type ? '#3b82f6' : '#1f2937',
                    background: form.vehicleType === type ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: form.vehicleType === type ? '#3b82f6' : '#9aa3b2',
                    fontSize: 13, cursor: 'pointer',
                    fontWeight: form.vehicleType === type ? 600 : 400,
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', margin: '0 0 6px' }}>🛠️ Services Requested *</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 14 }}>Select all services the customer needs</p>
          {services.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: 13, padding: '16px 0' }}>
              No services configured yet.{' '}
              <Link href="/shop/services" style={{ color: '#3b82f6' }}>Add services in shop settings →</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {services.map((svc) => {
                const selected = form.selectedServices.includes(svc.name);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => handleServiceToggle(svc.name)}
                    style={{
                      padding: '10px 14px', borderRadius: 8, border: '1px solid',
                      borderColor: selected ? '#22c55e' : '#1f2937',
                      background: selected ? 'rgba(34,197,94,0.15)' : '#111827',
                      color: selected ? '#22c55e' : '#9aa3b2',
                      fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      fontWeight: selected ? 600 : 400,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span>{selected ? '✅' : '○'}</span>
                    {svc.name}
                  </button>
                );
              })}
            </div>
          )}
          {form.selectedServices.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, color: '#22c55e', fontSize: 13 }}>
              ✓ {form.selectedServices.join(' · ')}
            </div>
          )}
        </div>

        {/* Location */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', margin: '0 0 16px' }}>📍 Location *</h2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={form.locationAddress}
              onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))}
              placeholder="Enter street address or use GPS"
              required
            />
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              style={{
                padding: '11px 18px', background: 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(59,130,246,0.4)', borderRadius: 8,
                color: '#3b82f6', fontSize: 13, fontWeight: 600,
                cursor: locating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {locating ? 'Locating...' : '📡 Use My Location'}
            </button>
          </div>
          {form.locationLat && (
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              GPS: {form.locationLat}, {form.locationLng} ·{' '}
              <a href={`https://www.google.com/maps?q=${form.locationLat},${form.locationLng}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>
                View on Map ↗
              </a>
            </div>
          )}
        </div>

        {/* Photos / Videos */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', margin: '0 0 6px' }}>📷 Photos &amp; Videos <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13 }}>(optional)</span></h2>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 14px' }}>Add up to 10 photos or videos of the issue</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '10px 20px', background: '#111827', border: '1px dashed #374151', borderRadius: 8, color: '#9aa3b2', fontSize: 14, cursor: 'pointer' }}
          >
            + Add Photos / Videos
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
          {mediaFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {mediaFiles.map((file, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#9aa3b2' }}>
                  <span>{file.type.startsWith('video') ? '🎥' : '📷'}</span>
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <button type="button" onClick={() => removeFile(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', margin: '0 0 12px' }}>📝 Notes <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13 }}>(optional)</span></h2>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Any additional details the technician should know..."
          />
        </div>

        {/* Submit */}
        {formError && (
          <p style={{color:'#f87171',fontSize:14,fontWeight:600,margin:'0 0 8px',padding:'10px 14px',background:'rgba(239,68,68,0.1)',borderRadius:8,border:'1px solid rgba(239,68,68,0.3)'}}>{formError}</p>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1, padding: '14px 24px',
              background: submitting ? '#374151' : 'linear-gradient(to right, #e5332a, #f97316)',
              border: 'none', borderRadius: 10, color: 'white', fontSize: 16, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Creating Work Order...' : '🚗 Create Roadside Work Order'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ padding: '14px 24px', background: '#111827', border: '1px solid #1f2937', borderRadius: 10, color: '#9aa3b2', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'transparent', color: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <NewRoadsideJobContent />
    </Suspense>
  );
}
