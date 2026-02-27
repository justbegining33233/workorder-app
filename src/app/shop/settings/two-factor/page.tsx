'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function TwoFactorSettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['shop', 'manager']);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'verify'>('idle');
  const [fetching, setFetching] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user) return;
    fetch('/api/auth/2fa/status', { headers })
      .then((r) => r.json())
      .then((d) => setIs2FAEnabled(d.enabled ?? false))
      .catch(() => {});
  }, [user]);

  async function handleSetup() {
    setFetching(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup failed');
      setOtpCode(data.code); // demo: show returned code
      setStep('verify');
      setStatus('A verification code has been generated. Enter it below to enable 2FA.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  }

  async function handleVerify() {
    if (!inputCode.trim()) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: inputCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setIs2FAEnabled(true);
      setStep('idle');
      setOtpCode('');
      setInputCode('');
      setStatus('✅ Two-Factor Authentication is now enabled on your account.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  }

  async function handleDisable() {
    if (!confirm('Disable Two-Factor Authentication? Your account will be less secure.')) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable');
      setIs2FAEnabled(false);
      setStatus('2FA has been disabled.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  }

  const bg = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>
        Loading...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/shop/admin/settings" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 32, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            🔐 Two-Factor Authentication
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
            Add an extra layer of security to your account. When enabled, you will need to enter a one-time code in addition to your password when logging in.
          </p>

          {/* Status Banner */}
          <div style={{
            background: is2FAEnabled ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${is2FAEnabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>{is2FAEnabled ? '🟢' : '🔴'}</span>
            <span style={{ color: is2FAEnabled ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
              2FA is currently {is2FAEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          {/* Feedback messages */}
          {status && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#86efac', fontSize: 14 }}>
              {status}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* OTP verify step */}
          {step === 'verify' && (
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <p style={{ color: '#93c5fd', fontSize: 14, marginBottom: 12, fontWeight: 600 }}>
                Enter your 6-digit verification code
              </p>
              {otpCode && (
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontFamily: 'monospace' }}>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Demo code (production uses email/SMS): </span>
                  <span style={{ color: '#fbbf24', fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>{otpCode}</span>
                </div>
              )}
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                maxLength={6}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: 16,
                  fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={handleVerify} disabled={fetching || inputCode.length !== 6} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: inputCode.length !== 6 ? 0.5 : 1 }}>
                  {fetching ? 'Verifying…' : 'Verify & Enable 2FA'}
                </button>
                <button onClick={() => { setStep('idle'); setOtpCode(''); setInputCode(''); }} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {step === 'idle' && (
            <div>
              {!is2FAEnabled ? (
                <button
                  onClick={handleSetup}
                  disabled={fetching}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                >
                  {fetching ? 'Generating Code…' : '🔐 Enable Two-Factor Authentication'}
                </button>
              ) : (
                <button
                  onClick={handleDisable}
                  disabled={fetching}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                >
                  {fetching ? 'Disabling…' : '🔓 Disable Two-Factor Authentication'}
                </button>
              )}
            </div>
          )}

          {/* Info */}
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: '#94a3b8' }}>Note:</strong> In production, verification codes are sent via email or SMS. 
              For demo purposes, the code is returned in the API response. 
              Codes expire after 10 minutes and can only be used once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
