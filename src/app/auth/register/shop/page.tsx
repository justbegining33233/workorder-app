import Link from 'next/link';

export default function ShopRegistrationPage() {
  return (
    <div style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40}}>
      <div style={{textAlign: 'center'}}>
        <h2 style={{marginBottom:12}}>Shop Registration</h2>
        <p style={{color:'#6b7280', marginBottom:20}}>This page requires a client-side form. Click the button below to open the client registration experience.</p>
        <Link href="/auth/register/shop/client" style={{padding:12, background:'#3b82f6', color:'white', borderRadius:8, textDecoration:'none', fontWeight:600}}>Open Client Registration</Link>
      </div>
    </div>
  );
}