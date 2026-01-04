'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Utility function for generating transaction IDs
const generateTransactionId = () => {
  return `txn_stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

interface Payment {
  id: string;
  amount: number;
  service: string;
  status: 'Paid' | 'Pending';
  transactionId?: string;
  date: string;
  shop: string;
  invoice: string;
  method: string;
}

export default function Payments() {
  const [userName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || '';
    }
    return '';
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');

    if (role !== 'customer') {
      window.location.href = '/auth/login';
      return;
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  const handlePayment = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    setProcessingPayment(paymentId);
    
    // Simulate realistic payment processing steps
    try {
      // Step 1: Validate payment method (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Process with payment processor (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Transfer to shop account (0.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock transaction ID
      const transactionId = generateTransactionId();
      
      // Update payment status
      setPayments(prevPayments => {
        const updated = [...prevPayments];
        const index = updated.findIndex(p => p.id === paymentId);
        if (index !== -1) {
          updated[index] = { 
            ...updated[index], 
            status: 'Paid' as const,
            transactionId: transactionId
          };
        }
        return updated;
      });
      
      setProcessingPayment(null);
      
      // Show success message
      alert(`✅ Payment Successful!\n\nAmount: $${payment.amount.toFixed(2)}\nService: ${payment.service}\nTransaction ID: ${transactionId}`);
      
    } catch {
      setProcessingPayment(null);
      alert('❌ Payment failed. Please try again or contact support.');
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Payments</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb', marginBottom:32}}>Payment History</h1>

        {/* Payment Summary */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:24, marginBottom:32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>Total Paid</div>
            <div style={{fontSize:28, fontWeight:700, color:'#3b82f6'}}>
              ${payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <div style={{fontSize:12, color:'#6b7280'}}>{payments.filter(p => p.status === 'Paid').length} transactions</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>Pending</div>
            <div style={{fontSize:28, fontWeight:700, color:'#f59e0b'}}>
              ${payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <div style={{fontSize:12, color:'#6b7280'}}>{payments.filter(p => p.status === 'Pending').length} payments due</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>This Month</div>
            <div style={{fontSize:28, fontWeight:700, color:'#22c55e'}}>
              ${payments.filter(p => p.date.includes('Dec 20')).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <div style={{fontSize:12, color:'#6b7280'}}>December spending</div>
          </div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {payments.map(payment => (
            <div key={payment.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16}}>
                <div>
                  <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>${payment.amount.toFixed(2)}</div>
                  <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>{payment.service} • {payment.shop}</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>{payment.invoice} • {payment.date} • {payment.method}</div>
                  {payment.transactionId && (
                    <div style={{fontSize:11, color:'#4ade80', marginTop:4}}>
                      Transaction: {payment.transactionId}
                    </div>
                  )}
                </div>
                <span style={{
                  padding:'6px 12px',
                  background: payment.status === 'Paid' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                  color: payment.status === 'Paid' ? '#22c55e' : '#f59e0b',
                  borderRadius:12,
                  fontSize:12,
                  fontWeight:600
                }}>
                  {payment.status}
                </span>
              </div>
              <div style={{display:'flex', gap:12}}>
                <button style={{
                  padding:'8px 16px',
                  background:'#3b82f6',
                  color:'white',
                  border:'none',
                  borderRadius:6,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  View Invoice
                </button>
                {payment.status === 'Pending' && (
                  <button 
                    onClick={() => handlePayment(payment.id)}
                    disabled={processingPayment === payment.id}
                    style={{
                      padding:'8px 16px',
                      background: processingPayment === payment.id ? 'rgba(156,163,175,0.1)' : 'rgba(34,197,94,0.1)',
                      color: processingPayment === payment.id ? '#9ca3af' : '#22c55e',
                      border: processingPayment === payment.id ? '1px solid rgba(156,163,175,0.3)' : '1px solid rgba(34,197,94,0.3)',
                      borderRadius:6,
                      fontSize:14,
                      fontWeight:600,
                      cursor: processingPayment === payment.id ? 'not-allowed' : 'pointer',
                      opacity: processingPayment === payment.id ? 0.6 : 1
                    }}
                  >
                    {processingPayment === payment.id ? 'Processing...' : 'Pay Now'}
                  </button>
                )}
                <button style={{
                  padding:'8px 16px',
                  background:'rgba(168,85,247,0.1)',
                  color:'#a855f7',
                  border:'1px solid rgba(168,85,247,0.3)',
                  borderRadius:6,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  Download Receipt
                </button>
              </div>
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            No payment history found.
          </div>
        )}

        {/* Back to Dashboard */}
        <div style={{marginTop:32, textAlign:'center'}}>
          <Link href="/customer/dashboard" style={{
            padding:'12px 24px',
            background:'#3b82f6',
            color:'white',
            border:'none',
            borderRadius:8,
            fontSize:16,
            fontWeight:600,
            textDecoration:'none',
            cursor:'pointer'
          }}>
            Back to Dashboard
          </Link>
        </div>

        {/* Security Notice */}
        <div style={{marginTop:24, padding:16, background:'rgba(0,0,0,0.2)', borderRadius:8, textAlign:'center'}}>
          <div style={{fontSize:12, color:'#9aa3b2'}}>
            🔒 Secured by Stripe • PCI DSS Compliant • 256-bit SSL Encryption
          </div>
        </div>
      </div>
    </div>
  );
}