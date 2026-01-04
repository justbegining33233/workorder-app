'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmailTemplates() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin');
    if (role !== 'admin' || isSuperAdmin !== 'true') {
      router.push('/auth/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const templates = [
    { id: 'welcome', name: 'Welcome Email', description: 'Sent to new users upon registration', icon: '👋' },
    { id: 'shop-approved', name: 'Shop Approved', description: 'Notification when shop is approved', icon: '✅' },
    { id: 'shop-denied', name: 'Shop Denied', description: 'Notification when shop application is denied', icon: '❌' },
    { id: 'workorder-created', name: 'Work Order Created', description: 'Sent when new work order is created', icon: '🔧' },
    { id: 'workorder-assigned', name: 'Work Order Assigned', description: 'Sent to technician when assigned', icon: '👷' },
    { id: 'workorder-completed', name: 'Work Order Completed', description: 'Sent when work order is completed', icon: '✓' },
    { id: 'payment-received', name: 'Payment Received', description: 'Confirmation of payment received', icon: '💰' },
    { id: 'password-reset', name: 'Password Reset', description: 'Password reset request email', icon: '🔑' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(139,92,246,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/admin-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Admin Tools
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>✉️ Email Templates</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Manage email notifications and templates</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gridTemplateColumns:'300px 1fr', gap:24}}>
          {/* Templates List */}
          <div>
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16}}>
              <h3 style={{fontSize:16, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Templates</h3>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    style={{
                      padding:12,
                      background: selectedTemplate === template.id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                      border: selectedTemplate === template.id ? '1px solid rgba(139,92,246,0.5)' : '1px solid transparent',
                      borderRadius:8,
                      cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                      <span style={{fontSize:20}}>{template.icon}</span>
                      <span style={{fontSize:14, fontWeight:600, color:'#e5e7eb'}}>{template.name}</span>
                    </div>
                    <div style={{fontSize:12, color:'#9aa3b2'}}>{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            {selectedTemplate ? (
              <>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>
                  Edit Template: {templates.find(t => t.id === selectedTemplate)?.name}
                </h2>
                <div style={{display:'grid', gap:16}}>
                  <div>
                    <label style={{display:'block', fontSize:14, color:'#9aa3b2', marginBottom:8}}>Subject Line</label>
                    <input 
                      type="text" 
                      defaultValue="Welcome to FixTray!"
                      style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                    />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:14, color:'#9aa3b2', marginBottom:8}}>Email Body</label>
                    <textarea 
                      rows={12}
                      defaultValue="Hello {{name}},\n\nWelcome to FixTray! We're excited to have you on board.\n\nBest regards,\nThe FixTray Team"
                      style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14, fontFamily:'monospace', resize:'vertical'}}
                    />
                  </div>
                  <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, padding:12}}>
                    <div style={{fontSize:12, fontWeight:600, color:'#3b82f6', marginBottom:8}}>Available Variables:</div>
                    <div style={{fontSize:12, color:'#9aa3b2', fontFamily:'monospace'}}>
                      {`{{name}}, {{email}}, {{shopName}}, {{workOrderId}}, {{date}}`}
                    </div>
                  </div>
                  <div style={{display:'flex', justifyContent:'flex-end', gap:12}}>
                    <button 
                      style={{padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                    >
                      Send Test Email
                    </button>
                    <button 
                      style={{padding:'12px 24px', background:'#8b5cf6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{textAlign:'center', padding:60, color:'#9aa3b2'}}>
                <div style={{fontSize:48, marginBottom:16}}>✉️</div>
                <div style={{fontSize:16}}>Select a template to edit</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
