'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaCar, FaSearch, FaUser, FaWrench } from 'react-icons/fa';

interface SearchResults {
  customers: Array<{ id: string; firstName: string; lastName: string; email: string; phone: string | null }>;
  workOrders: Array<{ id: string; status: string; vehicleType: string; createdAt: string; customer: { firstName: string; lastName: string } }>;
  vehicles: Array<{ id: string; make: string; model: string; year: number; licensePlate: string; customerId: string; customer: { firstName: string; lastName: string } }>;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/shop/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setResults(await res.json());
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const navigate = (path: string) => {
    setOpen(false);
    setQuery('');
    router.push(path);
  };

  const hasResults = results && (results.customers.length > 0 || results.workOrders.length > 0 || results.vehicles.length > 0);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          color: '#9aa3b2', fontSize: 13, cursor: 'pointer',
        }}
      >
        <FaSearch style={{marginRight:4}} /> Search
        <kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 11, color: '#6b7280' }}>Ctrl+K</kbd>
      </button>
    );
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />
      <div ref={ref} style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 600, zIndex: 9999,
        background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, work orders, vehicles..."
            style={{
              width: '100%', padding: '10px 12px',
              background: 'transparent', border: 'none',
              color: '#e5e7eb', fontSize: 16, outline: 'none',
            }}
          />
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto', padding: 8 }}>
          {loading && <div style={{ padding: 16, textAlign: 'center', color: '#9aa3b2', fontSize: 13 }}>Searching...</div>}

          {!loading && query.length >= 2 && !hasResults && (
            <div style={{ padding: 24, textAlign: 'center', color: '#9aa3b2', fontSize: 13 }}>No results found</div>
          )}

          {results && results.customers.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ padding: '4px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Customers</div>
              {results.customers.map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/shop/customers/${c.id}/crm`)}
                  style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#e5e7eb', fontSize: 14 }}><FaUser style={{marginRight:4}} /> {c.firstName} {c.lastName}</span>
                  <span style={{ color: '#9aa3b2', fontSize: 12 }}>{c.email}</span>
                </div>
              ))}
            </div>
          )}

          {results && results.workOrders.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ padding: '4px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Work Orders</div>
              {results.workOrders.map(wo => (
                <div
                  key={wo.id}
                  onClick={() => navigate(`/workorders/${wo.id}`)}
                  style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#e5e7eb', fontSize: 14 }}><FaWrench style={{marginRight:4}} /> {wo.id.slice(0, 8)}  -  {wo.customer.firstName} {wo.customer.lastName}</span>
                  <span style={{ color: '#9aa3b2', fontSize: 12 }}>{wo.status}</span>
                </div>
              ))}
            </div>
          )}

          {results && results.vehicles.length > 0 && (
            <div>
              <div style={{ padding: '4px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Vehicles</div>
              {results.vehicles.map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/shop/customers/${v.customerId}/crm`)}
                  style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#e5e7eb', fontSize: 14 }}><FaCar style={{marginRight:4}} /> {v.year} {v.make} {v.model}</span>
                  <span style={{ color: '#9aa3b2', fontSize: 12 }}>{v.licensePlate}  -  {v.customer.firstName} {v.customer.lastName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Esc to close</span>
        </div>
      </div>
    </>
  );
}
