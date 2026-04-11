'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useRequireAuth } from '@/contexts/AuthContext';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';

interface EnvCheck {
  name: string;
  category: string;
  status: 'ok' | 'missing' | 'warning';
  hint: string;
}

interface HealthData {
  checks: EnvCheck[];
  summary: { total: number; ok: number; missing: number; warning: number };
}

export default function HealthCheckPage() {
  useRequireAuth(['shop', 'admin', 'superadmin']);
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/health', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to fetch health:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  const statusIcon = (status: string) => {
    if (status === 'ok') return <FaCheckCircle style={{ color: '#22c55e', fontSize: 18, verticalAlign: 'middle' }} />;
    if (status === 'missing') return <FaTimesCircle style={{ color: '#e5332a', fontSize: 18, verticalAlign: 'middle' }} />;
    return <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: 18, verticalAlign: 'middle' }} />;
  };

  const statusColor = (status: string) => {
    if (status === 'ok') return '#22c55e';
    if (status === 'missing') return '#e5332a';
    return '#f59e0b';
  };

  const cardStyle = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
  };

  // Group checks by category
  const grouped = data?.checks.reduce((acc, check) => {
    (acc[check.category] = acc[check.category] || []).push(check);
    return acc;
  }, {} as Record<string, EnvCheck[]>);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <TopNavBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} showMenuButton />
      <Sidebar role="shop" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 32px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>System Health Check</h1>
        <p style={{ fontSize: 14, color: '#9aa3b2', marginBottom: 24 }}>Environment variable status and configuration health</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9aa3b2' }}>Checking system health...</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#e5332a' }}>Failed to load health data</div>
        ) : (
          <>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Total Checks</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#e5e7eb' }}>{data.summary.total}</div>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Configured</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>{data.summary.ok}</div>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Missing (Critical)</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#e5332a' }}>{data.summary.missing}</div>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 4 }}>Not Set (Optional)</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{data.summary.warning}</div>
              </div>
            </div>

            {/* Overall health bar */}
            {data.summary.missing > 0 && (
              <div style={{ ...cardStyle, marginBottom: 24, background: 'rgba(229,51,42,0.1)', border: '1px solid rgba(229,51,42,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaTimesCircle style={{ fontSize: 20, color: '#e5332a' }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e5332a' }}>Critical configuration missing</div>
                    <div style={{ fontSize: 13, color: '#e5e7eb' }}>{data.summary.missing} required environment variable(s) are not set. The application may not function correctly.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Checks grouped by category */}
            {grouped && Object.entries(grouped).map(([category, checks]) => (
              <div key={category} style={{ ...cardStyle, marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 12 }}>{category}</h2>
                {checks.map(check => (
                  <div key={check.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span style={{ fontSize: 14, color: '#e5e7eb', fontFamily: 'monospace' }}>{check.name}</span>
                      <div style={{ fontSize: 12, color: '#9aa3b2', marginTop: 2 }}>{check.hint}</div>
                    </div>
                    <span style={{ fontSize: 14, color: statusColor(check.status), fontWeight: 600 }}>
                      {statusIcon(check.status)} {check.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
