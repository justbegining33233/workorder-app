'use client';

import { useState } from 'react';
import Link from 'next/link';
import WorkOrderForm from '@/components/WorkOrderForm';

export default function NewWorkOrder() {
  const [userRole] = useState<'customer' | 'tech' | 'manager'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('userRole') as 'customer' | 'tech' | 'manager') || 'customer';
    }
    return 'customer';
  });

  const isCustomer = userRole === 'customer';

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <header style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:8}}>
            ← Back
          </Link>
          <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb', marginTop:16}}>
            {isCustomer ? 'Submit Service Request' : 'Work Order Management'}
          </h1>
          <p style={{color:'#9aa3b2', marginTop:12, fontSize:16}}>
            {isCustomer 
              ? 'Describe the vehicle issue and symptoms so our technicians can prepare an accurate estimate.'
              : 'Create or edit work orders with full access to all fields and options.'}
          </p>
        </div>
      </header>

      <div style={{maxWidth:800, margin:'0 auto', padding:'48px 32px'}}>
        <WorkOrderForm />
      </div>
    </div>
  );
}
