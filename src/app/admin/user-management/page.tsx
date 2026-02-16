'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'shop' | 'customer' | 'technician' | 'manager';
  status: 'active' | 'suspended' | 'pending';
  joinedDate: Date;
  lastLogin: Date;
  organization?: string;
};

export default function UserManagement() {
  const { user, isLoading } = useRequireAuth(['admin']);
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isLoading) return;

    // Fetch all users
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formattedUsers = data.map(u => ({
            ...u,
            joinedDate: new Date(u.joinedDate || u.createdAt || Date.now()),
            lastLogin: new Date(u.lastLogin || Date.now())
          }));
          setUsers(formattedUsers);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setLoading(false);
      });
  }, [user, isLoading]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#e5332a';
      case 'shop': return '#22c55e';
      case 'manager': return '#3b82f6';
      case 'technician': return '#8b5cf6';
      case 'customer': return '#f59e0b';
      default: return '#9aa3b2';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#e5332a';
      default: return '#9aa3b2';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e5e7eb',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

  let filteredUsers = users;
  if (filterRole !== 'all') filteredUsers = filteredUsers.filter(u => u.role === filterRole);
  if (filterStatus !== 'all') filteredUsers = filteredUsers.filter(u => u.status === filterStatus);

  const userStats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    shop: users.filter(u => u.role === 'shop').length,
    manager: users.filter(u => u.role === 'manager').length,
    technician: users.filter(u => u.role === 'technician').length,
    customer: users.filter(u => u.role === 'customer').length,
    active: users.filter(u => u.status === 'active').length,
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(168,85,247,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>👥 User Management</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Manage all platform users and roles</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Stats Overview */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:16, marginBottom:24}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:16}}>
            <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Total Users</div>
            <div style={{fontSize:24, fontWeight:700, color:'#3b82f6'}}>{userStats.total}</div>
          </div>
          <div style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:16}}>
            <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Admins</div>
            <div style={{fontSize:24, fontWeight:700, color:'#e5332a'}}>{userStats.admin}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:16}}>
            <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Shops</div>
            <div style={{fontSize:24, fontWeight:700, color:'#22c55e'}}>{userStats.shop}</div>
          </div>
          <div style={{background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:12, padding:16}}>
            <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Technicians</div>
            <div style={{fontSize:24, fontWeight:700, color:'#8b5cf6'}}>{userStats.technician}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:16}}>
            <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Customers</div>
            <div style={{fontSize:24, fontWeight:700, color:'#f59e0b'}}>{userStats.customer}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{display:'flex', gap:16, marginBottom:24}}>
          <div>
            <label style={{display:'block', fontSize:12, color:'#9aa3b2', marginBottom:8, fontWeight:600}}>Filter by Role</label>
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{padding:'10px 16px', background:'rgba(0,0,0,0.3)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', minWidth:150}}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="shop">Shop</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div>
            <label style={{display:'block', fontSize:12, color:'#9aa3b2', marginBottom:8, fontWeight:600}}>Filter by Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{padding:'10px 16px', background:'rgba(0,0,0,0.3)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', minWidth:150}}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div style={{textAlign:'center', padding:60, color:'#9aa3b2'}}>
            <div style={{fontSize:48, marginBottom:16}}>⏳</div>
            <div>Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{textAlign:'center', padding:60, color:'#9aa3b2'}}>
            <div style={{fontSize:48, marginBottom:16}}>👥</div>
            <div>No users found</div>
          </div>
        ) : (
          <div style={{display:'grid', gap:16}}>
            {filteredUsers.map((user) => (
              <div key={user.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:20}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                    <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>{user.name}</h3>
                    <span style={{padding:'4px 12px', background:`${getRoleColor(user.role)}20`, color:getRoleColor(user.role), borderRadius:8, fontSize:11, fontWeight:600}}>
                      {user.role.toUpperCase()}
                    </span>
                    <span style={{padding:'4px 12px', background:`${getStatusColor(user.status)}20`, color:getStatusColor(user.status), borderRadius:8, fontSize:11, fontWeight:600}}>
                      {user.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>✉️ {user.email}</div>
                  {user.organization && (
                    <div style={{fontSize:13, color:'#6b7280'}}>🏢 {user.organization}</div>
                  )}
                  <div style={{fontSize:12, color:'#6b7280', marginTop:8}}>
                    Joined: {user.joinedDate.toLocaleDateString()} • Last login: {getTimeAgo(user.lastLogin)}
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button style={{padding:'10px 16px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                    Edit
                  </button>
                  {user.status === 'active' ? (
                    <button style={{padding:'10px 16px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                      Suspend
                    </button>
                  ) : (
                    <button style={{padding:'10px 16px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
