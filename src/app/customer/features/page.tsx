'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from '../../../components/NotificationBell';
import '../../../styles/sos-theme.css';

function CustomerFeaturesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loyaltyPoints, setLoyaltyPoints] = useState(250);
  const [tier, setTier] = useState('Silver');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (!userRole || userRole !== 'customer') {
      router.push('/auth/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const features = [
    { id: 'overview', icon: '📊', name: 'Overview' },
    { id: 'findshops', icon: '🔍', name: 'Find Shops' },
    { id: 'tracking', icon: '📍', name: 'Live Tracking' },
    { id: 'messages', icon: '💬', name: 'Messages' },
    { id: 'payments', icon: '💳', name: 'Payments' },
    { id: 'appointments', icon: '📅', name: 'Appointments' },
    { id: 'reviews', icon: '⭐', name: 'Reviews' },
    { id: 'favorites', icon: '❤️', name: 'Favorites' },
    { id: 'rewards', icon: '🎁', name: 'Rewards' },
    { id: 'documents', icon: '📄', name: 'Documents' },
    { id: 'quotes', icon: '💰', name: 'Price Quotes' },
    { id: 'history', icon: '📋', name: 'Service History' },
    { id: 'insights', icon: '📈', name: 'Insights' },
  ];

  return (
    <div className="sos-wrap">
      <div className="sos-card" style={{maxWidth:1400}}>
        <div className="sos-header">
          <div className="sos-brand">
            <span className="mark">SOS</span>
            <span className="sub">Customer Portal</span>
          </div>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <div style={{fontSize:12, color:'#b8beca'}}>
              {tier} • {loyaltyPoints} pts
            </div>
            <NotificationBell />
            <button
              onClick={() => {
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
                router.push('/auth/login');
              }}
              className="btn-outline"
            >
              Sign Out
            </button>
            <Link href="/" className="btn-outline">← Home</Link>
          </div>
        </div>

        <div className="sos-content" style={{gridTemplateColumns:'200px 1fr'}}>
          {/* Sidebar */}
          <div className="sos-pane" style={{padding:'20px 12px', borderRight:'1px solid #5a5a5a'}}>
            <div style={{display:'flex', flexDirection:'column', gap:4}}>
              {features.map(feature => (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className="btn-outline"
                  style={{
                    justifyContent:'flex-start',
                    padding:'10px 12px',
                    background: activeTab === feature.id ? 'rgba(229,51,42,0.14)' : 'transparent',
                    border: activeTab === feature.id ? '1px solid rgba(229,51,42,0.28)' : '1px solid #5a5a5a',
                    color: activeTab === feature.id ? '#ffb3ad' : '#f5f7fb',
                  }}
                >
                  <span style={{marginRight:8}}>{feature.icon}</span>
                  <span style={{fontSize:13}}>{feature.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="sos-pane" style={{padding:28}}>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'findshops' && <FindShopsTab />}
            {activeTab === 'tracking' && <TrackingTab />}
            {activeTab === 'messages' && <MessagesTab />}
            {activeTab === 'payments' && <PaymentsTab />}
            {activeTab === 'appointments' && <AppointmentsTab />}
            {activeTab === 'reviews' && <ReviewsTab />}
            {activeTab === 'favorites' && <FavoritesTab />}
            {activeTab === 'rewards' && <RewardsTab points={loyaltyPoints} />}
            {activeTab === 'documents' && <DocumentsTab />}
            {activeTab === 'quotes' && <QuotesTab />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'insights' && <InsightsTab />}
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

function OverviewTab() {
  return (
    <div>
      <div className="sos-title">Dashboard Overview</div>
      <p className="sos-desc">Your complete service management hub</p>
      
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginTop:24}}>
        {[
          { label: 'Active Orders', value: '3', color: '#60a5fa' },
          { label: 'Pending Payment', value: '$450', color: '#fbbf24' },
          { label: 'Completed', value: '12', color: '#4ade80' },
          { label: 'Loyalty Points', value: '250', color: '#a78bfa' },
        ].map((stat, i) => (
          <div key={i} className="sos-item" style={{flexDirection:'column', alignItems:'flex-start'}}>
            <div style={{fontSize:11, color:'#9aa3b2', marginBottom:8}}>{stat.label}</div>
            <div style={{fontSize:24, fontWeight:800, color:stat.color}}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:32}}>
        <div style={{fontSize:16, fontWeight:700, marginBottom:16}}>Quick Actions</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
          <Link href="/workorders/new" className="btn-primary" style={{textAlign:'center'}}>+ New Work Order</Link>
          <button className="btn-outline">Schedule Service</button>
          <button className="btn-outline">View History</button>
        </div>
      </div>
    </div>
  );
}

function TrackingTab() {
  return (
    <div>
      <div className="sos-title">Live Tech Tracking</div>
      <p className="sos-desc">See your technician's real-time location and ETA</p>
      
      <div className="sos-item" style={{marginTop:24, padding:24, flexDirection:'column', alignItems:'flex-start'}}>
        <div style={{fontSize:48, marginBottom:16}}>🚗</div>
        <div style={{fontSize:16, fontWeight:700, marginBottom:8}}>John (Tech #42)</div>
        <div style={{fontSize:13, color:'#b8beca', marginBottom:16}}>En route to your location</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, width:'100%'}}>
          <div>
            <div style={{fontSize:11, color:'#9aa3b2'}}>ETA</div>
            <div style={{fontSize:18, fontWeight:700, color:'#ff7a59'}}>12 mins</div>
          </div>
          <div>
            <div style={{fontSize:11, color:'#9aa3b2'}}>Distance</div>
            <div style={{fontSize:18, fontWeight:700}}>2.3 mi</div>
          </div>
        </div>
        <button className="btn-primary" style={{marginTop:16, width:'100%'}}>Call Tech</button>
      </div>
    </div>
  );
}

function MessagesTab() {
  const messages = [
    { sender: 'Tech John', message: 'I\'ll be there in 15 minutes', time: '10:30 AM', from: 'tech' },
    { sender: 'You', message: 'Great, see you soon!', time: '10:32 AM', from: 'customer' },
  ];

  return (
    <div>
      <div className="sos-title">Messages</div>
      <p className="sos-desc">Chat with your technician</p>
      
      <div className="sos-list" style={{marginTop:24}}>
        {messages.map((msg, i) => (
          <div key={i} className="sos-item" style={{
            flexDirection:'column',
            alignItems: msg.from === 'customer' ? 'flex-end' : 'flex-start',
            background: msg.from === 'customer' ? 'rgba(229,51,42,0.14)' : '#454545',
          }}>
            <div style={{fontSize:11, fontWeight:600, marginBottom:4}}>{msg.sender}</div>
            <div style={{fontSize:13, marginBottom:4}}>{msg.message}</div>
            <div style={{fontSize:10, color:'#9aa3b2'}}>{msg.time}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:16, display:'flex', gap:8}}>
        <input className="sos-input" placeholder="Type a message..." style={{flex:1}} />
        <button className="btn-primary">Send</button>
      </div>
    </div>
  );
}

function PaymentsTab() {
  return (
    <div>
      <div className="sos-title">Payment Methods & History</div>
      <p className="sos-desc">Manage your payment options</p>
      
      <div style={{marginTop:24}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>Saved Payment Methods</div>
        <div className="sos-list">
          <div className="sos-item">
            <div>
              <div style={{fontWeight:600}}>Visa •••• 4242</div>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Expires 12/25</div>
            </div>
            <span className="sos-pill" style={{fontSize:10}}>Default</span>
          </div>
        </div>
        <button className="btn-outline" style={{marginTop:12}}>+ Add Payment Method</button>
      </div>

      <div style={{marginTop:32}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>Recent Transactions</div>
        <div className="sos-list">
          {[
            { id: '#1234', amount: '$225.00', date: '12/10/2025', status: 'Completed' },
            { id: '#1233', amount: '$150.00', date: '11/28/2025', status: 'Completed' },
          ].map((txn, i) => (
            <div key={i} className="sos-item">
              <div>
                <div style={{fontWeight:600}}>{txn.id}</div>
                <div style={{fontSize:12, color:'#9aa3b2'}}>{txn.date}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700, color:'#4ade80'}}>{txn.amount}</div>
                <div style={{fontSize:11, color:'#9aa3b2'}}>{txn.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppointmentsTab() {
  return (
    <div>
      <div className="sos-title">Appointments</div>
      <p className="sos-desc">Schedule and manage your service appointments</p>
      
      <div className="sos-item" style={{marginTop:24, flexDirection:'column', alignItems:'flex-start'}}>
        <div style={{fontSize:16, fontWeight:700, marginBottom:8}}>Upcoming Appointment</div>
        <div style={{display:'flex', gap:16, width:'100%', marginBottom:16}}>
          <div style={{fontSize:48}}>📅</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600, marginBottom:4}}>Oil Change Service</div>
            <div style={{fontSize:13, color:'#b8beca', marginBottom:2}}>Monday, Dec 16, 2025</div>
            <div style={{fontSize:13, color:'#b8beca'}}>9:00 AM - 11:00 AM</div>
          </div>
        </div>
        <div style={{display:'flex', gap:8, width:'100%'}}>
          <button className="btn-outline" style={{flex:1}}>Reschedule</button>
          <button className="btn-outline" style={{flex:1}}>Cancel</button>
          <button className="btn-primary" style={{flex:1}}>Add to Calendar</button>
        </div>
      </div>

      <button className="btn-primary" style={{marginTop:16, width:'100%'}}>+ Schedule New Appointment</button>
    </div>
  );
}

function ReviewsTab() {
  return (
    <div>
      <div className="sos-title">Reviews & Ratings</div>
      <p className="sos-desc">Rate your service experiences</p>
      
      <div style={{marginTop:24}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>Pending Reviews</div>
        <div className="sos-item" style={{flexDirection:'column', alignItems:'flex-start'}}>
          <div style={{fontWeight:600, marginBottom:8}}>Work Order #1234</div>
          <div style={{fontSize:13, color:'#b8beca', marginBottom:12}}>Completed on 12/10/2025</div>
          <div style={{marginBottom:12}}>
            {[1,2,3,4,5].map(star => (
              <span key={star} style={{fontSize:24, cursor:'pointer'}}>⭐</span>
            ))}
          </div>
          <textarea className="sos-input" placeholder="Share your experience..." style={{width:'100%', minHeight:80, marginBottom:12}} />
          <button className="btn-primary">Submit Review</button>
        </div>
      </div>

      <div style={{marginTop:32}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>Your Reviews</div>
        <div className="sos-list">
          <div className="sos-item" style={{flexDirection:'column', alignItems:'flex-start'}}>
            <div style={{marginBottom:8}}>⭐⭐⭐⭐⭐</div>
            <div style={{fontSize:13, marginBottom:4}}>"Excellent service! Very professional."</div>
            <div style={{fontSize:11, color:'#9aa3b2'}}>Work Order #1230 • 11/28/2025</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoritesTab() {
  return (
    <div>
      <div className="sos-title">Favorite Services</div>
      <p className="sos-desc">Quick access to your frequently used services</p>
      
      <div className="sos-list" style={{marginTop:24}}>
        {[
          { name: 'Oil Change (Semi)', count: 8 },
          { name: 'Tire Rotation', count: 5 },
          { name: 'Brake Inspection', count: 3 },
        ].map((fav, i) => (
          <div key={i} className="sos-item">
            <div>
              <div style={{fontWeight:600}}>{fav.name}</div>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Used {fav.count} times</div>
            </div>
            <button className="btn-primary">Reorder</button>
          </div>
        ))}
      </div>

      <button className="btn-outline" style={{marginTop:16, width:'100%'}}>+ Save Current Order as Favorite</button>
    </div>
  );
}

function RewardsTab({ points }: { points: number }) {
  return (
    <div>
      <div className="sos-title">Loyalty & Rewards</div>
      <p className="sos-desc">Earn points and redeem rewards</p>
      
      <div className="sos-item" style={{marginTop:24, padding:24, flexDirection:'column', alignItems:'center', background:'linear-gradient(135deg, rgba(229,51,42,0.2) 0%, rgba(255,122,89,0.2) 100%)'}}>
        <div style={{fontSize:48, marginBottom:8}}>🎁</div>
        <div style={{fontSize:32, fontWeight:800, marginBottom:4}}>{points} Points</div>
        <div style={{fontSize:13, color:'#b8beca'}}>Silver Tier Member</div>
      </div>

      <div style={{marginTop:24}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>Available Rewards</div>
        <div className="sos-list">
          {[
            { name: '10% Off Next Service', cost: 100 },
            { name: '$25 Off Any Service', cost: 250 },
            { name: 'Free Oil Change', cost: 500 },
          ].map((reward, i) => (
            <div key={i} className="sos-item">
              <div>
                <div style={{fontWeight:600}}>{reward.name}</div>
                <div style={{fontSize:12, color:'#9aa3b2'}}>{reward.cost} points</div>
              </div>
              <button className="btn-primary" disabled={points < reward.cost}>
                {points >= reward.cost ? 'Redeem' : 'Locked'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sos-item" style={{marginTop:24, padding:16, flexDirection:'column', alignItems:'flex-start'}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:8}}>Referral Program</div>
        <div style={{fontSize:12, color:'#b8beca', marginBottom:12}}>Share your code and earn 50 points per referral!</div>
        <div style={{display:'flex', gap:8, width:'100%'}}>
          <input className="sos-input" value="REF-DEMO123" readOnly style={{flex:1}} />
          <button className="btn-primary">Copy</button>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab() {
  return (
    <div>
      <div className="sos-title">Documents</div>
      <p className="sos-desc">Access warranties, receipts, and service records</p>
      
      <div className="sos-list" style={{marginTop:24}}>
        {[
          { type: 'Warranty', name: 'Engine Repair Warranty', date: '12/10/2025' },
          { type: 'Receipt', name: 'Service Receipt #1234', date: '12/10/2025' },
          { type: 'Contract', name: 'Service Agreement', date: '11/01/2025' },
        ].map((doc, i) => (
          <div key={i} className="sos-item">
            <div>
              <div style={{fontWeight:600}}>{doc.name}</div>
              <div style={{fontSize:12, color:'#9aa3b2'}}>{doc.type} • {doc.date}</div>
            </div>
            <button className="btn-outline">Download</button>
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{marginTop:16, width:'100%'}}>+ Upload Document</button>
    </div>
  );
}

function QuotesTab() {
  return (
    <div>
      <div className="sos-title">Price Quotes</div>
      <p className="sos-desc">Get instant estimates for services</p>
      
      <div className="sos-item" style={{marginTop:24, padding:24, flexDirection:'column', alignItems:'flex-start'}}>
        <div style={{fontSize:16, fontWeight:700, marginBottom:16}}>Oil Change - Semi Truck</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, width:'100%'}}>
          {[
            { tier: 'Basic', price: '$120', desc: 'Standard oil' },
            { tier: 'Standard', price: '$150', desc: 'Synthetic blend' },
            { tier: 'Premium', price: '$200', desc: 'Full synthetic' },
          ].map((tier, i) => (
            <div key={i} className="sos-item" style={{flexDirection:'column', padding:16, border: i === 1 ? '2px solid #e5332a' : '1px solid #5a5a5a'}}>
              <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>{tier.tier}</div>
              <div style={{fontSize:24, fontWeight:800, marginBottom:4}}>{tier.price}</div>
              <div style={{fontSize:11, color:'#b8beca', marginBottom:12}}>{tier.desc}</div>
              <button className={i === 1 ? 'btn-primary' : 'btn-outline'} style={{width:'100%', fontSize:12}}>
                Select
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" style={{marginTop:16, width:'100%'}}>Get New Quote</button>
    </div>
  );
}

function HistoryTab() {
  return (
    <div>
      <div className="sos-title">Service History</div>
      <p className="sos-desc">Complete maintenance logs and records</p>
      
      <div className="sos-list" style={{marginTop:24}}>
        {[
          { service: 'Oil Change', date: '12/10/2025', cost: '$150', vehicle: 'Semi-Truck #42' },
          { service: 'Tire Rotation', date: '11/28/2025', cost: '$89', vehicle: 'Trailer #8' },
          { service: 'Brake Inspection', date: '11/15/2025', cost: '$75', vehicle: 'Semi-Truck #42' },
        ].map((log, i) => (
          <div key={i} className="sos-item">
            <div style={{flex:1}}>
              <div style={{fontWeight:600}}>{log.service}</div>
              <div style={{fontSize:12, color:'#9aa3b2'}}>{log.vehicle} • {log.date}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:700}}>{log.cost}</div>
              <button className="btn-outline" style={{fontSize:11, padding:'4px 8px', marginTop:4}}>View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsTab() {
  return (
    <div>
      <div className="sos-title">Service Insights</div>
      <p className="sos-desc">Analytics and recommendations for your fleet</p>
      
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginTop:24}}>
        {[
          { label: 'Total Spent (YTD)', value: '$3,240' },
          { label: 'Avg Order Value', value: '$270' },
          { label: 'Services This Year', value: '12' },
        ].map((stat, i) => (
          <div key={i} className="sos-item" style={{flexDirection:'column', alignItems:'flex-start'}}>
            <div style={{fontSize:11, color:'#9aa3b2', marginBottom:8}}>{stat.label}</div>
            <div style={{fontSize:20, fontWeight:800}}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:32}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>Upcoming Maintenance</div>
        <div className="sos-list">
          <div className="sos-item">
            <div>
              <div style={{fontWeight:600}}>Oil Change Due</div>
              <div style={{fontSize:12, color:'#9aa3b2'}}>Semi-Truck #42 • Due in 14 days</div>
            </div>
            <span className="sos-pill" style={{background:'rgba(251,191,36,0.14)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.28)'}}>
              Medium
            </span>
          </div>
        </div>
      </div>

      <div style={{marginTop:32}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>Recommendations</div>
        <div className="sos-list">
          <div className="sos-item" style={{flexDirection:'column', alignItems:'flex-start'}}>
            <div style={{fontWeight:600, marginBottom:4}}>Tire Rotation</div>
            <div style={{fontSize:12, color:'#b8beca', marginBottom:8}}>Due based on mileage • Est. $89</div>
            <button className="btn-primary" style={{fontSize:12}}>Schedule Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FindShopsTab() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Simple distance calculation using zip code proximity
  // First 3 digits of zip code represent general region
  const calculateDistance = (zip1: string, zip2: string) => {
    if (!zip1 || !zip2) return 999;
    
    const prefix1 = parseInt(zip1.substring(0, 3));
    const prefix2 = parseInt(zip2.substring(0, 3));
    const diff = Math.abs(prefix1 - prefix2);
    
    // Rough estimate: each prefix difference ≈ 50 miles
    return diff * 50;
  };

  const handleSearch = async () => {
    if (!zipCode || zipCode.length < 5) {
      alert('Please enter a valid 5-digit ZIP code');
      return;
    }

    setLoading(true);
    setSearchPerformed(true);

    try {
      // Fetch all accepted shops
      const response = await fetch('/api/shops/accepted');
      const allShops = await response.json();

      // Calculate distances and filter within 100 miles
      const shopsWithDistance = allShops
        .map((shop: any) => ({
          ...shop,
          distance: calculateDistance(zipCode, shop.zipCode || '00000')
        }))
        .filter((shop: any) => shop.distance <= 100)
        .sort((a: any, b: any) => a.distance - b.distance);

      setShops(shopsWithDistance);
    } catch (error) {
      console.error('Error fetching shops:', error);
      alert('Error loading shops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="sos-title">Find Shops Near You</div>
      <p className="sos-desc">Search for shops within 100 miles of your location</p>

      <div style={{marginTop:24, marginBottom:32}}>
        <div style={{display:'flex', gap:12, maxWidth:500}}>
          <input
            type="text"
            placeholder="Enter your ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').substring(0, 5))}
            className="sos-input"
            style={{flex:1}}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch} 
            className="btn-primary"
            disabled={loading}
            style={{minWidth:120}}
          >
            {loading ? 'Searching...' : 'Find Shops'}
          </button>
        </div>
      </div>

      {searchPerformed && (
        <div>
          {shops.length === 0 ? (
            <div className="sos-item" style={{justifyContent:'center', padding:32}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:48, marginBottom:12}}>🔍</div>
                <div style={{fontSize:16, fontWeight:600, marginBottom:8}}>No shops found</div>
                <div style={{fontSize:13, color:'#9aa3b2'}}>
                  There are no registered shops within 100 miles of {zipCode}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:14, fontWeight:700, marginBottom:16}}>
                Found {shops.length} shop{shops.length !== 1 ? 's' : ''} near {zipCode}
              </div>
              <div className="sos-list">
                {shops.map((shop) => (
                  <div key={shop.id} className="sos-item" style={{flexDirection:'column', alignItems:'flex-start', gap:12}}>
                    <div style={{width:'100%', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontSize:16, fontWeight:700, marginBottom:4}}>{shop.shopName || shop.name}</div>
                        <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>
                          {shop.location} • {shop.phone}
                        </div>
                        <div style={{fontSize:12, color:'#b8beca'}}>
                          {shop.address}
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:20, fontWeight:700, color:'#3b82f6'}}>{shop.distance} mi</div>
                        <div style={{fontSize:11, color:'#9aa3b2'}}>away</div>
                      </div>
                    </div>
                    
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      {shop.rating > 0 && (
                        <span className="sos-pill" style={{background:'rgba(245,158,11,0.14)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.28)'}}>
                          ⭐ {shop.rating} Rating
                        </span>
                      )}
                      {shop.jobs > 0 && (
                        <span className="sos-pill" style={{background:'rgba(59,130,246,0.14)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.28)'}}>
                          {shop.jobs} Jobs Completed
                        </span>
                      )}
                      <span className="sos-pill" style={{background:'rgba(34,197,94,0.14)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.28)'}}>
                        {shop.status || 'Verified'}
                      </span>
                    </div>

                    <div style={{display:'flex', gap:8, width:'100%'}}>
                      <button 
                        className="btn-primary" 
                        style={{flex:1}}
                        onClick={() => {
                          localStorage.setItem('selectedShopForService', JSON.stringify(shop));
                          router.push('/workorders/new');
                        }}
                      >
                        Request Service
                      </button>
                      <button 
                        className="btn-outline" 
                        style={{flex:1}}
                        onClick={() => {
                          setSelectedShop(shop);
                          setShowDetailsModal(true);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shop Details Modal */}
      {showDetailsModal && selectedShop && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}} onClick={() => setShowDetailsModal(false)}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:32, maxWidth:600, width:'90%', maxHeight:'80vh', overflow:'auto'}} onClick={(e) => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
              <div>
                <div style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{selectedShop.shopName || selectedShop.name}</div>
                <div style={{fontSize:14, color:'#9aa3b2'}}>{selectedShop.location}</div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div>
                <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>Contact Information</div>
                <div style={{fontSize:14, color:'#e5e7eb'}}>📞 {selectedShop.phone}</div>
                <div style={{fontSize:14, color:'#e5e7eb'}}>📧 {selectedShop.email}</div>
                <div style={{fontSize:14, color:'#e5e7eb', marginTop:8}}>📍 {selectedShop.address}</div>
              </div>

              <div style={{borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:16}}>
                <div style={{fontSize:12, color:'#9aa3b2', marginBottom:8}}>Shop Performance</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
                  <div>
                    <div style={{fontSize:11, color:'#9aa3b2'}}>Rating</div>
                    <div style={{fontSize:18, fontWeight:700, color:'#f59e0b'}}>
                      {selectedShop.rating > 0 ? `⭐ ${selectedShop.rating}` : 'No rating yet'}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#9aa3b2'}}>Jobs Completed</div>
                    <div style={{fontSize:18, fontWeight:700, color:'#3b82f6'}}>{selectedShop.jobs}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#9aa3b2'}}>Distance</div>
                    <div style={{fontSize:18, fontWeight:700, color:'#22c55e'}}>{selectedShop.distance} mi</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#9aa3b2'}}>Status</div>
                    <div style={{fontSize:18, fontWeight:700, color:'#4ade80'}}>{selectedShop.status || 'Verified'}</div>
                  </div>
                </div>
              </div>

              {selectedShop.completionRate !== undefined && (
                <div style={{borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:16}}>
                  <div style={{fontSize:12, color:'#9aa3b2', marginBottom:8}}>Additional Info</div>
                  <div style={{fontSize:14, color:'#e5e7eb'}}>Completion Rate: {selectedShop.completionRate}%</div>
                  <div style={{fontSize:14, color:'#e5e7eb'}}>Avg Response Time: {selectedShop.averageResponseTime}</div>
                  <div style={{fontSize:14, color:'#e5e7eb'}}>Joined: {new Date(selectedShop.joinedDate).toLocaleDateString()}</div>
                </div>
              )}

              {/* Offered Services Section */}
              <div style={{borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:16, marginBottom:16}}>
                <div style={{fontSize:13, color:'#9aa3b2', marginBottom:12, fontWeight:600}}>Services Offered</div>
                {selectedShop.services && selectedShop.services.length > 0 ? (
                  <div style={{display:'flex', flexDirection:'column', gap:16}}>
                    {/* Diesel Services */}
                    {selectedShop.dieselServices && selectedShop.dieselServices.length > 0 && (
                      <div>
                        <div style={{fontSize:12, color:'#fbbf24', marginBottom:8, fontWeight:600, display:'flex', alignItems:'center', gap:6}}>
                          <span style={{fontSize:16}}>🚛</span> DIESEL SERVICES
                        </div>
                        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                          {selectedShop.dieselServices.map((service: any) => (
                            <span key={service.id} style={{background:'rgba(251,191,36,0.14)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.28)', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600}}>
                              {service.serviceName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Gas Services */}
                    {selectedShop.gasServices && selectedShop.gasServices.length > 0 && (
                      <div>
                        <div style={{fontSize:12, color:'#3b82f6', marginBottom:8, fontWeight:600, display:'flex', alignItems:'center', gap:6}}>
                          <span style={{fontSize:16}}>🚗</span> GAS SERVICES
                        </div>
                        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                          {selectedShop.gasServices.map((service: any) => (
                            <span key={service.id} style={{background:'rgba(59,130,246,0.14)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.28)', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600}}>
                              {service.serviceName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{color:'#9aa3b2', fontSize:13}}>No services listed for this shop.</div>
                )}
              </div>
              <div style={{borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:16, display:'flex', gap:12}}>
                <button 
                  className="btn-primary" 
                  style={{flex:1}}
                  onClick={() => {
                    localStorage.setItem('selectedShopForService', JSON.stringify(selectedShop));
                    router.push('/workorders/new');
                  }}
                >
                  Request Service
                </button>
                <button 
                  className="btn-outline" 
                  style={{flex:1}}
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerFeaturesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerFeaturesPageContent />
    </Suspense>
  );
}
