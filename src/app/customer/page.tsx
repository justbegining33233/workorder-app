'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/customer/dashboard');
  }, [router]);
  
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:18}}>
      Redirecting to Customer Portal...
    </div>
  );
}
