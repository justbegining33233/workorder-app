'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MessagingCard from '@/components/MessagingCard';

interface Job {
  id: string;
  service: string;
  priority: string;
  customer: string;
  vehicle: string;
  time: string;
  tech: string;
  status: string;
}

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  status: string;
  jobs: number;
}

interface InventoryItem {
  part: string;
  stock: number;
  reorder: number;
  status: string;
}

export default function ShopHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isShopAdmin, setIsShopAdmin] = useState(false); // Track if user is shop owner/admin
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'tech' as 'tech' | 'manager',
    email: '',
    phone: '',
    password: ''
  });
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [shopStats] = useState({
    openJobs: 0,
    completedToday: 0,
    todayRevenue: '$0',
    weekRevenue: '$0',
    activeTechs: 0,
    pendingApprovals: 0
  });
  const [teamMembers] = useState<TeamMember[]>([]);
  const [inventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');
    const shop = localStorage.getItem('shopId');
    const shopAdmin = localStorage.getItem('isShopAdmin'); // Check if user created the shop
    const profileComplete = localStorage.getItem('shopProfileComplete');
    
    // Allow shop owners and managers to access
    if (role !== 'shop' && role !== 'manager') {
      router.push('/auth/login');
      return;
    }
    
    // Only check profile completion for shop owners, not managers
    if (role === 'shop' && profileComplete !== 'true') {
      router.push('/shop/complete-profile');
      return;
    }
    
    if (name) setUserName(name);
    if (id) setUserId(id);
    if (shop) setShopId(shop);
    if (role) setUserRole(role);
    if (shopAdmin === 'true') setIsShopAdmin(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/auth/login');
  };

  const handleAddMember = () => {
    // Save employee credentials to localStorage
    const employees = JSON.parse(localStorage.getItem('shopEmployees') || '[]');
    const newEmployee = {
      name: newMember.name,
      role: newMember.role,
      email: newMember.email,
      phone: newMember.phone,
      password: newMember.password,
      shopName: userName, // Link to the shop
      createdAt: new Date().toISOString()
    };
    employees.push(newEmployee);
    localStorage.setItem('shopEmployees', JSON.stringify(employees));
    
    console.log('Added team member:', newEmployee);
    alert(`Team member added!\n\nLogin credentials:\nEmail/Phone: ${newMember.email} or ${newMember.phone}\nPassword: ${newMember.password}`);
    
    // Reset form and close modal
    setNewMember({ name: '', role: 'tech', email: '', phone: '', password: '' });
    setShowAddMember(false);
  };

  const handleOrderPart = (partName: string, currentStock: number, reorderLevel: number) => {
    const orderQuantity = reorderLevel * 2;
    const confirmed = confirm(`Order ${orderQuantity} units of ${partName}?\n\nCurrent Stock: ${currentStock}\nOrder Quantity: ${orderQuantity}\nEstimated Delivery: 2-3 business days`);
    
    if (confirmed) {
      alert(`✅ Order placed successfully!\n\n${orderQuantity} units of ${partName} ordered.\nNew stock level will be ${currentStock + orderQuantity} units upon delivery.`);
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>SOS</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>{userName}</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Shop Dashboard</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          {/* Role-based back button */}
          {userRole === 'admin' && (
            <Link href="/admin/home" style={{padding:'8px 16px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, textDecoration:'none', fontSize:13, fontWeight:600}}>
              ← Back to Admin Dashboard
            </Link>
          )}
          {userRole === 'manager' && (
            <Link href="/manager/home" style={{padding:'8px 16px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, textDecoration:'none', fontSize:13, fontWeight:600}}>
              ← Back to Manager Dashboard
            </Link>
          )}
          {userRole === 'tech' && (
            <Link href="/tech/home" style={{padding:'8px 16px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, textDecoration:'none', fontSize:13, fontWeight:600}}>
              ← Back to Tech Dashboard
            </Link>
          )}
          <span style={{padding:'4px 12px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:12, fontSize:12, fontWeight:600}}>
            ● Open
          </span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Shop Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Open Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6'}}>{shopStats.openJobs}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Completed Today</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.completedToday}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Today's Revenue</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.todayRevenue}</div>
          </div>
          <div style={{background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>This Week</div>
            <div style={{fontSize:32, fontWeight:700, color:'#a855f7'}}>{shopStats.weekRevenue}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Active Techs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b'}}>{shopStats.activeTechs}</div>
          </div>
          <div style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Pending Approvals</div>
            <div style={{fontSize:32, fontWeight:700, color:'#e5332a'}}>{shopStats.pendingApprovals}</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Left Column */}
          <div>
            {/* Today's Schedule */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Today's Schedule</h2>
                <Link href="/workorders/list" style={{fontSize:13, color:'#3b82f6', textDecoration:'none'}}>View All →</Link>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {todayJobs.map(job => (
                  <div key={job.id} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                          <span style={{fontSize:15, fontWeight:700, color:'#e5e7eb'}}>{job.service}</span>
                          {job.priority === 'High' && (
                            <span style={{padding:'2px 8px', background:'rgba(229,51,42,0.2)', color:'#e5332a', borderRadius:8, fontSize:11, fontWeight:700}}>HIGH</span>
                          )}
                        </div>
                        <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>{job.customer} • {job.vehicle}</div>
                        <div style={{fontSize:12, color:'#6b7280'}}>{job.id} • {job.time} • Tech: {job.tech}</div>
                      </div>
                      <span style={{padding:'4px 12px', background:job.status === 'In Progress' ? 'rgba(34,197,94,0.2)' : job.status === 'Pending' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)', color:job.status === 'In Progress' ? '#22c55e' : job.status === 'Pending' ? '#f59e0b' : '#3b82f6', borderRadius:12, fontSize:12, fontWeight:600}}>
                        {job.status}
                      </span>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <Link href={`/workorders/${job.id}`} style={{flex:1}}>
                        <button style={{width:'100%', padding:'8px', background:'#22c55e', color:'white', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                          Update Status
                        </button>
                      </Link>
                      <Link href={`/workorders/${job.id}`} style={{flex:1}}>
                        <button style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex', gap:12, marginTop:16}}>
                <Link href="/workorders/new" style={{flex:1}}>
                  <button style={{width:'100%', padding:'12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                    + Roadside Job
                  </button>
                </Link>
                <Link href="/shop/new-inshop-job" style={{flex:1}}>
                  <button style={{width:'100%', padding:'12px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                    + In-Shop Job
                  </button>
                </Link>
              </div>
            </div>

            {/* Team Overview */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Team Status</h2>
                {isShopAdmin && (
                  <button onClick={() => setShowAddMember(true)} style={{padding:'8px 16px', background:'#22c55e', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600}}>
                    + Add Team Member
                  </button>
                )}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
                {teamMembers.map((member, idx) => (
                  <div key={idx} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                    <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                      <span style={{fontSize:32}}>{member.avatar}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15, fontWeight:700, color:'#e5e7eb'}}>{member.name}</div>
                        <div style={{display:'flex', alignItems:'center', gap:6, marginTop:4}}>
                          <span style={{padding:'2px 8px', background:member.status === 'Active' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color:member.status === 'Active' ? '#22c55e' : '#f59e0b', borderRadius:8, fontSize:11, fontWeight:600}}>
                            ● {member.status}
                          </span>
                          <span style={{padding:'2px 8px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', borderRadius:8, fontSize:10, fontWeight:600}}>
                            {member.role === 'tech' ? '🔧 Tech' : '👔 Manager'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{fontSize:12, color:'#9aa3b2'}}>
                      Assigned Jobs: {member.jobs}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Parts and Set Labor */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Parts and Set Labor</h2>
                <span style={{padding:'4px 8px', background:'#e5332a', color:'white', borderRadius:12, fontSize:11, fontWeight:700}}>
                  {inventory.filter(p => p.status !== 'good').length} Alert
                </span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {inventory.map((item, idx) => (
                  <div key={idx} style={{background:'rgba(255,255,255,0.05)', border:`1px solid ${item.status === 'critical' ? 'rgba(229,51,42,0.3)' : item.status === 'low' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, padding:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                      <div style={{fontSize:13, fontWeight:700, color:'#e5e7eb'}}>{item.part}</div>
                      <span style={{fontSize:16, fontWeight:700, color:item.status === 'critical' ? '#e5332a' : item.status === 'low' ? '#f59e0b' : '#22c55e'}}>
                        {item.stock}
                      </span>
                    </div>
                    <div style={{fontSize:11, color:'#9aa3b2'}}>Reorder at: {item.reorder}</div>
                    {item.status !== 'good' && (
                      <button 
                        onClick={() => handleOrderPart(item.part, item.stock, item.reorder)}
                        style={{width:'100%', marginTop:8, padding:'6px', background:item.status === 'critical' ? '#e5332a' : '#f59e0b', color:'white', border:'none', borderRadius:4, fontSize:11, fontWeight:600, cursor:'pointer'}}
                      >
                        Order Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Link href="/shop/parts-labor">
                <button style={{width:'100%', marginTop:16, padding:'12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                  View Full Parts & Labor Management →
                </button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Quick Actions</h2>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {isShopAdmin && (
                  <Link href="/shop/admin">
                    <button style={{width:'100%', padding:'12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', textAlign:'left'}}>
                      ⚙️ Shop Admin Panel
                    </button>
                  </Link>
                )}
                <Link href="/workorders/list">
                  <button style={{width:'100%', padding:'12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    📋 All Work Orders
                  </button>
                </Link>
                <Link href="/reports">
                  <button style={{width:'100%', padding:'12px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    📊 Reports & Analytics
                  </button>
                </Link>
                <Link href="/shop/distributors">
                  <button style={{width:'100%', padding:'12px', background:'rgba(139,92,246,0.2)', color:'#8b5cf6', border:'1px solid rgba(139,92,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    🏢 Order from Distributors
                  </button>
                </Link>
                <Link href="/shop/manage-team">
                  <button style={{width:'100%', padding:'12px', background:'rgba(245,158,11,0.2)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    👥 Manage Team
                  </button>
                </Link>
                <Link href="/shop/customer-messages">
                  <button style={{width:'100%', padding:'12px', background:'rgba(168,85,247,0.2)', color:'#a855f7', border:'1px solid rgba(168,85,247,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    💬 Customer Messages
                  </button>
                </Link>
                <Link href="/shop/settings">
                  <button style={{width:'100%', padding:'12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    ⚙️ Shop Settings
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddMember && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Add Team Member</h2>
              <button onClick={() => setShowAddMember(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Role *</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <button type="button" onClick={() => setNewMember({...newMember, role: 'tech'})} style={{padding:16, background:newMember.role === 'tech' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', border:`2px solid ${newMember.role === 'tech' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer', color:'#e5e7eb', fontSize:14, fontWeight:600}}>
                  <div style={{fontSize:24, marginBottom:8}}>🔧</div>
                  Technician
                </button>
                <button type="button" onClick={() => setNewMember({...newMember, role: 'manager'})} style={{padding:16, background:newMember.role === 'manager' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border:`2px solid ${newMember.role === 'manager' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer', color:'#e5e7eb', fontSize:14, fontWeight:600}}>
                  <div style={{fontSize:24, marginBottom:8}}>👔</div>
                  Manager
                </button>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Full Name *</label>
              <input type="text" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} placeholder="John Doe" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Email Address *</label>
              <input type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} placeholder="john@example.com" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Phone Number *</label>
              <input type="tel" value={newMember.phone} onChange={(e) => setNewMember({...newMember, phone: e.target.value})} placeholder="(555) 123-4567" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Set Login Password *</label>
              <input type="password" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} placeholder="Create password for employee" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
              <p style={{fontSize:11, color:'#6b7280', marginTop:6}}>Employee can login with email or phone + this password</p>
            </div>

            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setShowAddMember(false)} style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleAddMember} disabled={!newMember.name || !newMember.email || !newMember.phone || !newMember.password} style={{flex:1, padding:'12px', background:(!newMember.name || !newMember.email || !newMember.phone || !newMember.password) ? 'rgba(34,197,94,0.3)' : '#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:(!newMember.name || !newMember.email || !newMember.phone || !newMember.password) ? 'not-allowed' : 'pointer'}}>
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
