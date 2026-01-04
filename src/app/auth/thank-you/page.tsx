'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/sos-theme.css';

export default function ThankYouPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      const userRole = localStorage.getItem('userRole');
      switch(userRole) {
        case 'customer':
          router.push('/customer/home');
          break;
        case 'shop':
          router.push('/shop/home');
          break;
        case 'tech':
          router.push('/tech/home');
          break;
        case 'manager':
          router.push('/manager/home');
          break;
        case 'admin':
          router.push('/admin/home');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [countdown, router]);

  return (
    <div className="sos-wrap">
      <div className="sos-card">
        <div className="sos-header">
          <div className="sos-brand">
            <span className="mark">SOS</span>
            <span className="sub">Service Order System</span>
          </div>
          <span className="sos-pill">Signed In</span>
        </div>
        <div className="sos-content">
          <div className="sos-pane" style={{gridColumn:'1 / -1'}}>
            <div className="sos-title" style={{textAlign:'center'}}>Thank you!</div>
            <p className="sos-desc" style={{textAlign:'center'}}>Registration successful! Redirecting to dashboard in <span style={{color:'#ff7a59', fontWeight:700}}>{countdown}s</span>…</p>
            <div className="sos-actions" style={{justifyContent:'center'}}>
              <Link
                href={(() => {
                  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
                  switch(userRole) {
                    case 'customer': return '/customer/home';
                    case 'shop': return '/shop/home';
                    case 'tech': return '/tech/home';
                    case 'manager': return '/manager/home';
                    case 'admin': return '/admin/home';
                    default: return '/dashboard';
                  }
                })()}
                className="btn-primary"
              >Go to Dashboard</Link>
              <Link href="/" className="btn-outline">Back to Home</Link>
            </div>
          </div>
        </div>
        <div className="sos-footer">
          <span className="sos-tagline">Manage work orders, customers, teams and billing.</span>
          <div className="accent-bar" style={{width:112, borderRadius:6}} />
        </div>
      </div>
    </div>
  );
}
