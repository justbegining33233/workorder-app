'use client';

import ShopRegistrationForm from '@/components/ShopRegistrationForm';
import Link from 'next/link';
import '@/styles/sos-theme.css';

export default function ShopRegistrationPage() {
  return (
    <div className="sos-wrap">
      <div style={{minHeight: '100vh', padding: '20px'}}>
        {/* Header */}
        <header style={{
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#9aa3b2',
            textDecoration: 'none',
            fontSize: 14,
            marginBottom: 24
          }}>
            ← Back to Home
          </Link>
          <div className="sos-brand" style={{justifyContent: 'center'}}>
            <span className="mark">FixTray</span>
            <span className="sub">Shop Registration</span>
          </div>
        </header>

        {/* Registration Form */}
        <div style={{maxWidth: 800, margin: '0 auto'}}>
          <ShopRegistrationForm />
        </div>
      </div>
    </div>
  );
}