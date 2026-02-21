import ShopRegistrationClientWrapper from '@/components/ShopRegistrationClientWrapper';
import Link from 'next/link';

export default function ShopRegistrationClientPage() {
  return (
    <div style={{minHeight: '100vh', padding: '20px'}}>
      <header style={{ marginBottom: 32, textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#9aa3b2', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
          ← Back to Home
        </Link>
        <div style={{ justifyContent: 'center' }}>
          <span style={{fontWeight:700, fontSize:18}}>FixTray</span>
          <span style={{marginLeft:8, color:'#9aa3b2'}}>Shop Registration (Client)</span>
        </div>
      </header>

      <div style={{maxWidth: 800, margin: '0 auto'}}>
        <ShopRegistrationClientWrapper />
      </div>
    </div>
  );
}
