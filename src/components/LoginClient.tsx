"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordResetForm from '@/components/PasswordResetForm';
import { getCsrfToken } from '@/lib/clientCsrf';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/sos-theme.css';

export default function LoginClient() {
  const router = useRouter();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [accountType, setAccountType] = useState<'customer' | 'shop' | null>(null);
  const [signupForm, setSignupForm] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '', agreeToTerms: false });
  const [shopSignupForm, setShopSignupForm] = useState({ shopName: '', ownerName: '', address: '', city: '', state: '', zip: '', phone: '', email: '', username: '', password: '', confirmPassword: '', agreeToTerms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReset, setShowReset] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!loginForm.username) newErrors.username = 'Username is required';
    if (!loginForm.password) newErrors['password'] = 'Password is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      // Admin
      try {
        const adminResponse = await fetch('/api/auth/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: loginForm.username, password: loginForm.password }), credentials: 'include' });
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          login({ token: adminData.accessToken, role: 'admin', name: adminData.username, id: adminData.id, isSuperAdmin: adminData.isSuperAdmin });
          router.push('/admin/home');
          return;
        }
      } catch (e) { /* ignore */ }

      // Tech/Manager
      try {
        const techResponse = await fetch('/api/auth/tech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: loginForm.username, password: loginForm.password }), credentials: 'include' });
        if (techResponse.ok) {
          const techData = await techResponse.json();
          login({ token: techData.accessToken, role: techData.role, name: techData.name, id: techData.id, shopId: techData.shopId });
          if (techData.role === 'tech') router.push('/tech/home'); else if (techData.role === 'manager') router.push('/manager/home');
          return;
        }
      } catch (e) { /* ignore */ }

      // Shop
      try {
        const shopResponse = await fetch('/api/auth/shop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: loginForm.username, password: loginForm.password }), credentials: 'include' });
        if (shopResponse.ok) {
          const shopAccount = await shopResponse.json();
          const profileComplete = !!shopAccount.profileComplete;
          if (!profileComplete && typeof window !== 'undefined') localStorage.removeItem('shopProfileComplete');
          login({ token: shopAccount.accessToken, role: 'shop', name: shopAccount.shopName, id: shopAccount.id, shopId: shopAccount.id, isShopAdmin: true, shopProfileComplete: profileComplete });
          const nextRoute = profileComplete ? '/shop/admin' : '/shop/complete-profile';
          router.push(nextRoute);
          return;
        }
      } catch (e) { /* ignore */ }

      // Customer
      try {
        const customerResponse = await fetch('/api/auth/customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginForm.username, password: loginForm.password }), credentials: 'include' });
        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          const token = customerData.token || customerData.accessToken || customerData.access_token;
          const name = customerData.fullName || `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
          const id = customerData.id || (customerData.user && customerData.user.id);
          login({ token, role: 'customer', name: name || 'Customer', id: id || '' });
          router.push('/customer/dashboard');
          return;
        }
      } catch (e) { /* ignore */ }

      setErrors({ username: 'Invalid username or password' });
      setLoading(false);
    } catch (error) {
      setErrors({ username: 'An error occurred during login. Please try again.' });
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!accountType) newErrors.accountType = 'Please select account type';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    if (accountType === 'shop') {
      const shopCredentials = JSON.parse(localStorage.getItem('shopCredentials') || '{}');
      shopCredentials[shopSignupForm.email] = { username: shopSignupForm.username, password: shopSignupForm.password, shopName: shopSignupForm.shopName };
      localStorage.setItem('shopCredentials', JSON.stringify(shopCredentials));
      try {
        const response = await fetch('/api/shops/pending', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopName: shopSignupForm.shopName, ownerName: shopSignupForm.ownerName || shopSignupForm.shopName, email: shopSignupForm.email, phone: shopSignupForm.phone, address: shopSignupForm.address, city: shopSignupForm.city, state: shopSignupForm.state, zipCode: shopSignupForm.zip, location: `${shopSignupForm.city}, ${shopSignupForm.state}`, businessLicense: 'Pending verification', insurancePolicy: 'Pending verification', services: 0, status: 'pending', username: shopSignupForm.username, password: shopSignupForm.password }) });
        if (response.ok) { setTimeout(() => { router.push('/auth/pending-approval'); setLoading(false); }, 1000); } else { alert('Failed to submit shop registration. Please try again.'); setLoading(false); }
      } catch (error) { alert('Error submitting registration. Please try again.'); setLoading(false); }
    } else {
      try {
        const csrfToken = getCsrfToken();
        const nameParts = signupForm.fullName.trim().split(' ');
        const firstName = nameParts[0] || signupForm.fullName;
        const lastName = nameParts.slice(1).join(' ') || 'User';
        const response = await fetch('/api/customers/register', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' }, body: JSON.stringify({ email: signupForm.email, username: signupForm.username || signupForm.email.split('@')[0], password: signupForm.password, firstName, lastName }) });
        if (response.ok) { const data = await response.json(); localStorage.setItem('userRole', accountType || 'customer'); localStorage.setItem('userName', signupForm.fullName); setTimeout(() => { router.push('/auth/thank-you'); setLoading(false); }, 1000); } else { const errorData = await response.json(); alert(errorData.error || 'Failed to create customer account. Please try again.'); setLoading(false); }
      } catch (error) { alert('Error creating account. Please try again.'); setLoading(false); }
    }
  };

  const toggleReset = () => setShowReset(s => !s);

  return (
    <div className="sos-wrap">
      <div className="sos-card">
        <div className="sos-header">
          <div className="sos-brand">
            <span className="mark">SOS</span>
            <span className="sub">Service Order System</span>
          </div>
        </div>
        <div className="sos-content">
          <div className="sos-pane">
            <div className="sos-title">Welcome back</div>
            <p className="sos-desc">Sign in to manage your work orders, customers, and teams.</p>
            <div className="sos-tabs">
              <button className={`sos-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setErrors({}); }}>Sign In</button>
              <button className={`sos-tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => { setActiveTab('signup'); setErrors({}); }}>Create Account</button>
            </div>
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="sos-form">
                <div className="sos-field">
                  <label>Username</label>
                  <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="sos-input" placeholder="Enter your username" />
                  {errors.username && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.username}</p>)}
                </div>
                <div className="sos-field">
                  <label>Password</label>
                  <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="sos-input" placeholder="••••••••" />
                  {errors.password && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.password}</p>)}
                </div>
                <div className="sos-actions">
                  <button type="submit" disabled={loading} className="btn-primary" style={{width:'100%'}}>{loading ? 'Signing in...' : 'Sign In'}</button>
                </div>
                <div style={{marginTop:8, textAlign:'center'}}>
                  <button type="button" onClick={toggleReset} className="btn-link" style={{fontSize:13}}>{showReset ? 'Hide password reset' : 'Forgot / Reset password'}</button>
                </div>
                {showReset && (<PasswordResetForm onClose={() => setShowReset(false)} />)}
              </form>
            )}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="sos-form">
                <div className="sos-field">
                  <label>I am signing up as: *</label>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <button type="button" onClick={() => { setAccountType('customer'); setErrors({}); }} className={`btn-outline ${accountType === 'customer' ? '' : ''}`} style={{padding:'16px', borderWidth:2, background: accountType === 'customer' ? 'rgba(229,51,42,0.14)' : 'transparent'}}>
                      <div style={{fontSize:'18px', marginBottom:'6px'}}>👤</div>
                      <div>Customer</div>
                      <div style={{fontSize:'11px', color:'#9aa3b2', marginTop:'4px'}}>Need service</div>
                    </button>
                    <button type="button" onClick={() => { setAccountType('shop'); setErrors({}); }} className={`btn-outline ${accountType === 'shop' ? '' : ''}`} style={{padding:'16px', borderWidth:2, background: accountType === 'shop' ? 'rgba(229,51,42,0.14)' : 'transparent'}}>
                      <div style={{fontSize:'18px', marginBottom:'6px'}}>🏪</div>
                      <div>Shop</div>
                      <div style={{fontSize:'11px', color:'#9aa3b2', marginTop:'4px'}}>Provide service</div>
                    </button>
                  </div>
                  {errors.accountType && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.accountType}</p>)}
                </div>

                {accountType === 'customer' && (
                  <>
                    <div className="sos-field">
                      <label>Full Name *</label>
                      <input type="text" value={signupForm.fullName} onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })} className="sos-input" placeholder="John Doe" />
                      {errors.fullName && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.fullName}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Username *</label>
                      <input type="text" value={signupForm.username} onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })} className="sos-input" placeholder="johndoe" />
                      {errors.username && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.username}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Email Address *</label>
                      <input type="email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} className="sos-input" placeholder="you@example.com" />
                      {errors.email && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.email}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Password *</label>
                      <input type="password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} className="sos-input" placeholder="••••••••" />
                      {errors.password && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.password}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Confirm Password *</label>
                      <input type="password" value={signupForm.confirmPassword} onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })} className="sos-input" placeholder="••••••••" />
                      {errors.confirmPassword && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.confirmPassword}</p>)}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={signupForm.agreeToTerms} onChange={(e) => setSignupForm({ ...signupForm, agreeToTerms: e.target.checked })} />
                      <span style={{fontSize:12, color:'#b8beca'}}>
                        I agree to the <button type="button" className="btn-outline" style={{padding:'2px 6px'}}>Terms of Service</button> and <button type="button" className="btn-outline" style={{padding:'2px 6px'}}>Privacy Policy</button>
                      </span>
                    </label>
                    {errors.agreeToTerms && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.agreeToTerms}</p>)}
                    <div className="sos-actions">
                      <button type="submit" disabled={loading} className="btn-primary" style={{width:'100%'}}>{loading ? 'Creating account...' : 'Create Account'}</button>
                    </div>
                  </>
                )}

                {accountType === 'shop' && (
                  <>
                    <div className="sos-field">
                      <label>Shop Name *</label>
                      <input type="text" value={shopSignupForm.shopName} onChange={(e) => setShopSignupForm({ ...shopSignupForm, shopName: e.target.value })} className="sos-input" placeholder="Mike's Auto Repair" />
                      {errors.shopName && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.shopName}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Street Address *</label>
                      <input type="text" value={shopSignupForm.address} onChange={(e) => setShopSignupForm({ ...shopSignupForm, address: e.target.value })} className="sos-input" placeholder="123 Main Street" />
                      {errors.address && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.address}</p>)}
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10}}>
                      <div className="sos-field">
                        <label>City *</label>
                        <input type="text" value={shopSignupForm.city} onChange={(e) => setShopSignupForm({ ...shopSignupForm, city: e.target.value })} className="sos-input" placeholder="Los Angeles" />
                        {errors.city && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.city}</p>)}
                      </div>
                      <div className="sos-field">
                        <label>State *</label>
                        <input type="text" value={shopSignupForm.state} onChange={(e) => setShopSignupForm({ ...shopSignupForm, state: e.target.value.toUpperCase() })} className="sos-input" placeholder="CA" maxLength={2} />
                        {errors.state && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.state}</p>)}
                      </div>
                      <div className="sos-field">
                        <label>ZIP *</label>
                        <input type="text" value={shopSignupForm.zip} onChange={(e) => setShopSignupForm({ ...shopSignupForm, zip: e.target.value })} className="sos-input" placeholder="90001" />
                        {errors.zip && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.zip}</p>)}
                      </div>
                    </div>
                    <div className="sos-field">
                      <label>Phone Number *</label>
                      <input type="tel" value={shopSignupForm.phone} onChange={(e) => setShopSignupForm({ ...shopSignupForm, phone: e.target.value })} className="sos-input" placeholder="(555) 123-4567" />
                      {errors.phone && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.phone}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Email Address *</label>
                      <input type="email" value={shopSignupForm.email} onChange={(e) => setShopSignupForm({ ...shopSignupForm, email: e.target.value })} className="sos-input" placeholder="contact@shop.com" />
                      {errors.email && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.email}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Username *</label>
                      <input type="text" value={shopSignupForm.username} onChange={(e) => setShopSignupForm({ ...shopSignupForm, username: e.target.value })} className="sos-input" placeholder="mikesauto" />
                      {errors.username && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.username}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Password *</label>
                      <input type="password" value={shopSignupForm.password} onChange={(e) => setShopSignupForm({ ...shopSignupForm, password: e.target.value })} className="sos-input" placeholder="••••••••" />
                      {errors.password && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.password}</p>)}
                    </div>
                    <div className="sos-field">
                      <label>Confirm Password *</label>
                      <input type="password" value={shopSignupForm.confirmPassword} onChange={(e) => setShopSignupForm({ ...shopSignupForm, confirmPassword: e.target.value })} className="sos-input" placeholder="••••••••" />
                      {errors.confirmPassword && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.confirmPassword}</p>)}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={shopSignupForm.agreeToTerms} onChange={(e) => setShopSignupForm({ ...shopSignupForm, agreeToTerms: e.target.checked })} />
                      <span style={{fontSize:12, color:'#b8beca'}}>
                        I agree to the <button type="button" className="btn-outline" style={{padding:'2px 6px'}}>Terms of Service</button> and <button type="button" className="btn-outline" style={{padding:'2px 6px'}}>Privacy Policy</button>
                      </span>
                    </label>
                    {errors.agreeToTerms && (<p style={{color:'#ff948d', fontSize:12, marginTop:4}}>{errors.agreeToTerms}</p>)}
                    <div className="sos-actions">
                      <button type="submit" disabled={loading} className="btn-primary" style={{width:'100%'}}>{loading ? 'Creating shop account...' : 'Create Shop Account'}</button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>

          <div className="sos-pane">
            <div className="sos-title">On this platform</div>
            <div className="sos-list">
              <div className="sos-item"><span>Manage work orders</span><span style={{fontSize:12, color:'#9aa3b2'}}>Create, assign, track</span></div>
              <div className="sos-item"><span>Customer directory</span><span style={{fontSize:12, color:'#9aa3b2'}}>Profiles & billing</span></div>
              <div className="sos-item"><span>Teams & roles</span><span style={{fontSize:12, color:'#9aa3b2'}}>Access control</span></div>
            </div>
          </div>
        </div>
        <div className="sos-footer">
          <span className="sos-tagline">© {new Date().getFullYear()} SOS • Service Order System</span>
          <div className="accent-bar" style={{width:112, borderRadius:6}} />
        </div>
      </div>
    </div>
  );
}
