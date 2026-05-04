import Link from 'next/link';

export default function ShopRegistrationPage() {
  return (
    <div style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40}}>
      <div style={{textAlign: 'center'}}>
        <h2 style={{marginBottom:12}}>Shop Registration</h2>
        <p style={{color:'#6b7280', marginBottom:20}}>Open the full registration flow to set up your shop profile, choose a subscription plan, and review the workflow FixTray offers.</p>
        <Link href="/auth/register/shop" style={{padding:12, background:'#3b82f6', color:'white', borderRadius:8, textDecoration:'none', fontWeight:600}}>Open Client Registration</Link>
      </div>
    </div>
  );
}