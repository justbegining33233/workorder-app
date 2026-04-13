'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CanceledContent() {
  const params = useSearchParams();
  const shopId = params?.get('shopId') ?? null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', padding: 24 }}>
      <div style={{ maxWidth: 520, width: '100%', background: '#fff', borderRadius: 12, padding: 48, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        {/* X icon */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Payment not completed
        </h1>

        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>
          You cancelled before completing checkout. Your shop registration has been saved  -  you can retry payment at any time.
        </p>

        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
          No charge was made. Contact us if you need help completing your registration.
        </p>

        {shopId && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>
            Shop reference: <code style={{ fontFamily: 'monospace' }}>{shopId}</code>
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href={"/shop/register" as Route}
            style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}
          >
            Try Again
          </Link>
          <Link
            href="/"
            style={{ display: 'inline-block', background: '#f1f5f9', color: '#334155', padding: '12px 24px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterCanceledPage() {
  return (
    <Suspense fallback={null}>
      <CanceledContent />
    </Suspense>
  );
}
