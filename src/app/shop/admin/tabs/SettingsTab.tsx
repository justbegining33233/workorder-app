'use client';

import { useState } from 'react';

interface SettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
  loading: boolean;
  handleUpdateSettings: () => void;
}

export default function SettingsTab({ settings, setSettings, loading, handleUpdateSettings }: SettingsTabProps) {
  const [geoMsg, setGeoMsg] = useState<{type:'success'|'error';text:string}|null>(null);
  if (!settings) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 32 }}>
      <h2 style={{ color: '#e5e7eb', marginBottom: 24, fontSize: 24 }}>Shop Settings</h2>

      <div style={{ display: 'grid', gap: 24 }}>
        <div>
          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
            Default Labor Rate (per hour)
          </label>
          <input
            type="number"
            value={settings.defaultLaborRate}
            onChange={(e) => setSettings({ ...settings, defaultLaborRate: parseFloat(e.target.value) })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
          />
        </div>

        <div>
          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
            Inventory Markup (0-5, e.g., 0.30 = 30%)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.01"
            value={settings.inventoryMarkup}
            onChange={(e) => setSettings({ ...settings, inventoryMarkup: parseFloat(e.target.value) })}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
          />
        </div>

        <div>
          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
            Weekly Payroll Budget ($)
          </label>
          <input
            type="number"
            min="0"
            value={settings.weeklyPayrollBudget || ''}
            onChange={(e) => setSettings({ ...settings, weeklyPayrollBudget: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="e.g., 5000"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
          />
        </div>

        <div>
          <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>
            Monthly Payroll Budget ($)
          </label>
          <input
            type="number"
            min="0"
            value={settings.monthlyPayrollBudget || ''}
            onChange={(e) => setSettings({ ...settings, monthlyPayrollBudget: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="e.g., 20000"
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
          />
        </div>

        {/* GPS Verification Settings */}
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: '#e5e7eb', marginBottom: 16, fontSize: 18 }}>?? GPS Verification</h3>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e5e7eb', cursor: 'pointer', marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={settings.gpsVerificationEnabled || false}
                onChange={(e) => setSettings({ ...settings, gpsVerificationEnabled: e.target.checked })}
              />
              Enable GPS verification for clock in/out
            </label>
          </div>

          {settings.gpsVerificationEnabled && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) { setGeoMsg({type:'error',text:'Geolocation not supported by this browser.'}); return; }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setSettings({ ...settings, shopLatitude: pos.coords.latitude, shopLongitude: pos.coords.longitude });
                        setGeoMsg({type:'success',text:`Location set: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`});
                      },
                      () => setGeoMsg({type:'error',text:'Could not get location. Please allow location access and try again.'}),
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}
                  style={{ padding: '10px 20px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 8, color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  ?? Use My Current Location
                </button>
                <div style={{ fontSize: 11, color: '#9aa3b2', marginTop: 4 }}>Click while you're at the shop to auto-fill coordinates</div>
                {geoMsg && (
                  <p style={{marginTop:8,fontSize:13,fontWeight:600,color:geoMsg.type==='success'?'#4ade80':'#f87171'}}>{geoMsg.text}</p>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Shop Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.shopLatitude || ''}
                    onChange={(e) => setSettings({ ...settings, shopLatitude: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="e.g., 40.7128"
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Shop Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.shopLongitude || ''}
                    onChange={(e) => setSettings({ ...settings, shopLongitude: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="e.g., -74.0060"
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Radius (meters)</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.gpsRadiusMeters || 100}
                    onChange={(e) => setSettings({ ...settings, gpsRadiusMeters: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div style={{ color: '#9aa3b2', fontSize: 12, marginTop: 8 }}>
            Employees must be within the specified radius to clock in/out.
          </div>
        </div>

        <button
          onClick={handleUpdateSettings}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#e5332a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
