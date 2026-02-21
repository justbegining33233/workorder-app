
import Link from 'next/link';

export default function PendingApproval() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{fontSize: '64px', marginBottom: '24px'}}>⏳</div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#e5e7eb',
          marginBottom: '16px'
        }}>
          Registration Submitted!
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#9aa3b2',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Thank you for registering your shop. Your application is now pending approval from our admin team.
        </p>
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#f59e0b',
            marginBottom: '12px'
          }}>
            What happens next?
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            color: '#e5e7eb',
            fontSize: '14px',
            lineHeight: '1.8'
          }}>
            <li style={{marginBottom: '8px'}}>✓ Our admin team will review your application</li>
            <li style={{marginBottom: '8px'}}>✓ You&apos;ll receive an email notification once approved</li>
            <li style={{marginBottom: '8px'}}>✓ After approval, you can log in and start using the system</li>
          </ul>
        </div>
        
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '24px'
        }}>
          Approval typically takes 1-2 business days
        </p>
        
        <Link
          href="/auth/login"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #e53333 0%, #c62828 100%)',
            color: 'white',
            padding: '12px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
