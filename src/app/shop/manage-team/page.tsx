'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  assignedJobs: number;
  joinedDate: string;
}

interface StoredEmployee {
  name: string;
  role: string;
  email: string;
  phone: string;
  createdAt?: string;
}

export default function ManageTeamPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'tech', email: '', phone: '', password: '' });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  // Load team members on mount
  React.useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const shopId = localStorage.getItem('shopId');
      
      if (!shopId) {
        console.error('No shopId found in localStorage');
        return;
      }

      const response = await fetch(`/api/techs?shopId=${shopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const techs = data.techs || [];
        
        const loadedMembers = techs.map((tech: any) => ({
          id: tech.id,
          name: `${tech.firstName} ${tech.lastName}`,
          role: tech.role,
          email: tech.email,
          phone: tech.phone || '',
          status: tech.available ? 'active' : 'inactive',
          assignedJobs: tech._count?.assignedWorkOrders || 0,
          joinedDate: tech.createdAt
        }));
        setTeamMembers(loadedMembers);
      } else {
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('shopEmployees');
          if (stored) {
            const employees = JSON.parse(stored);
            // Filter by current shopId
            const shopEmployees = employees.filter((emp: any) => emp.shopId === shopId);
            const loadedMembers = shopEmployees.map((emp: StoredEmployee, idx: number) => ({
              id: `emp-${idx}`,
              name: emp.name,
              role: emp.role,
              email: emp.email,
              phone: emp.phone,
              status: 'active',
              assignedJobs: 0,
              joinedDate: emp.createdAt || new Date().toISOString()
            }));
            setTeamMembers(loadedMembers);
          }
        }
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const shopId = localStorage.getItem('shopId');
        const stored = localStorage.getItem('shopEmployees');
        if (stored) {
          const employees = JSON.parse(stored);
          // Filter by current shopId
          const shopEmployees = employees.filter((emp: any) => emp.shopId === shopId);
          const loadedMembers = shopEmployees.map((emp: StoredEmployee, idx: number) => ({
            id: `emp-${idx}`,
            name: emp.name,
            role: emp.role,
            email: emp.email,
            phone: emp.phone,
            status: 'active',
            assignedJobs: 0,
            joinedDate: emp.createdAt || new Date().toISOString()
          }));
          setTeamMembers(loadedMembers);
        }
      }
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.phone || !newMember.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const shopId = localStorage.getItem('shopId');
      
      // Split name into first and last name
      const nameParts = newMember.name.trim().split(' ');
      const firstName = nameParts[0] || newMember.name;
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Call API to create tech/manager in database
      const response = await fetch('/api/techs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newMember.email,
          password: newMember.password,
          firstName: firstName,
          lastName: lastName,
          phone: newMember.phone,
          role: newMember.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to add team member');
        return;
      }

      const createdTech = await response.json();
      console.log('✅ Tech/Manager created in database:', createdTech);

      // Also save to localStorage for backward compatibility
      const employees = JSON.parse(localStorage.getItem('shopEmployees') || '[]');
      const newEmployee = {
        ...newMember,
        shopId,
        createdAt: new Date().toISOString()
      };
      employees.push(newEmployee);
      localStorage.setItem('shopEmployees', JSON.stringify(employees));

      alert('Team member added successfully!');
      setShowAddModal(false);
      setNewMember({ name: '', role: 'tech', email: '', phone: '', password: '' });
      loadTeamMembers();
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member. Please try again.');
    }
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      // TODO: Replace with API call
      const filtered = teamMembers.filter(m => m.id !== id);
      setTeamMembers(filtered);
      alert('Team member removed');
    }
  };

  const handleEditMember = (member: TeamMember) => {
    const nameParts = member.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setEditingMember({
      id: member.id,
      firstName,
      lastName,
      email: member.email,
      phone: member.phone,
      role: member.role,
      hourlyRate: 0 // Default value, will be fetched from API
    });
    setShowEditModal(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !editingMember.firstName || !editingMember.email || !editingMember.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Updating employee:', editingMember.id);
      console.log('Form data:', editingMember);

      const response = await fetch(`/api/techs/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editingMember.firstName,
          lastName: editingMember.lastName,
          email: editingMember.email,
          phone: editingMember.phone,
          hourlyRate: parseFloat(editingMember.hourlyRate) || 0,
          role: editingMember.role,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        alert(data.error || 'Failed to update team member');
        return;
      }

      alert('Team member updated successfully!');
      setShowEditModal(false);
      setEditingMember(null);
      loadTeamMembers();
    } catch (error) {
      console.error('Error updating team member:', error);
      alert('Failed to update team member. Please try again.');
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display:'flex', flexDirection:'column'}}>
      {/* Top Navigation */}
      <TopNavBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} showMenuButton={true} />
      
      {/* Breadcrumbs */}
      <Breadcrumbs />
      
      {/* Main Layout with Sidebar */}
      <div style={{display:'flex', flex:1}}>
        {/* Sidebar */}
        <Sidebar role="shop" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div style={{flex:1, overflowY:'auto'}}>
          <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
            {/* Page Header */}
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>👥 Manage Team</h1>
              <p style={{fontSize:14, color:'#9aa3b2'}}>Add and manage your shop team members</p>
              <button 
                onClick={() => setShowAddModal(true)}
                style={{marginTop:16, padding:'12px 24px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                + Add Team Member
              </button>
            </div>

      <div style={{maxWidth:1200, margin:'0 auto'}}>
        {/* Team Members List */}
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          {teamMembers.length === 0 ? (
            <div style={{textAlign:'center', padding:40}}>
              <div style={{fontSize:48, marginBottom:16}}>👥</div>
              <h3 style={{fontSize:20, fontWeight:600, color:'#e5e7eb', marginBottom:8}}>No Team Members Yet</h3>
              <p style={{color:'#9aa3b2', marginBottom:20}}>Add technicians and managers to your team</p>
              <button 
                onClick={() => setShowAddModal(true)}
                style={{padding:'12px 24px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                + Add First Team Member
              </button>
            </div>
          ) : (
            <div style={{display:'grid', gap:16}}>
              {teamMembers.map((member) => (
                <div key={member.id} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:20}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                        <span style={{fontSize:32}}>{member.role === 'tech' ? '🔧' : '👔'}</span>
                        <div>
                          <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{member.name}</h3>
                          <div style={{display:'flex', gap:8}}>
                            <span style={{padding:'4px 12px', background:member.role === 'tech' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', color:member.role === 'tech' ? '#22c55e' : '#3b82f6', borderRadius:12, fontSize:12, fontWeight:600}}>
                              {member.role === 'tech' ? 'Technician' : 'Manager'}
                            </span>
                            <span style={{padding:'4px 12px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:12, fontSize:12, fontWeight:600}}>
                              ● Active
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
                        <div>
                          <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Email</div>
                          <div style={{fontSize:14, color:'#e5e7eb'}}>{member.email}</div>
                        </div>
                        <div>
                          <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Phone</div>
                          <div style={{fontSize:14, color:'#e5e7eb'}}>{member.phone}</div>
                        </div>
                        <div>
                          <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Assigned Jobs</div>
                          <div style={{fontSize:14, color:'#e5e7eb'}}>{member.assignedJobs}</div>
                        </div>
                        <div>
                          <div style={{fontSize:11, color:'#9aa3b2', marginBottom:4}}>Joined</div>
                          <div style={{fontSize:14, color:'#e5e7eb'}}>{new Date(member.joinedDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button 
                        onClick={() => handleEditMember(member)}
                        style={{padding:'8px 16px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer'}}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        style={{padding:'8px 16px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer'}}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Add Team Member</h2>
              <button onClick={() => setShowAddModal(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
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

            <div style={{marginBottom:16}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Full Name *</label>
              <input type="text" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} placeholder="John Doe" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Email *</label>
              <input type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} placeholder="john@example.com" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Phone *</label>
              <input type="tel" value={newMember.phone} onChange={(e) => setNewMember({...newMember, phone: e.target.value})} placeholder="(555) 123-4567" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Password *</label>
              <input type="password" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} placeholder="••••••••" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setShowAddModal(false)} style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleAddMember} style={{flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Edit Team Member</h2>
              <button onClick={() => setShowEditModal(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Role *</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <button type="button" onClick={() => setEditingMember({...editingMember, role: 'tech'})} style={{padding:16, background:editingMember.role === 'tech' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', border:`2px solid ${editingMember.role === 'tech' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer', color:'#e5e7eb', fontSize:14, fontWeight:600}}>
                  <div style={{fontSize:24, marginBottom:8}}>🔧</div>
                  Technician
                </button>
                <button type="button" onClick={() => setEditingMember({...editingMember, role: 'manager'})} style={{padding:16, background:editingMember.role === 'manager' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border:`2px solid ${editingMember.role === 'manager' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer', color:'#e5e7eb', fontSize:14, fontWeight:600}}>
                  <div style={{fontSize:24, marginBottom:8}}>👔</div>
                  Manager
                </button>
              </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>First Name *</label>
                <input type="text" value={editingMember.firstName} onChange={(e) => setEditingMember({...editingMember, firstName: e.target.value})} placeholder="John" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
              </div>
              <div>
                <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Last Name *</label>
                <input type="text" value={editingMember.lastName} onChange={(e) => setEditingMember({...editingMember, lastName: e.target.value})} placeholder="Doe" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Email *</label>
              <input type="email" value={editingMember.email} onChange={(e) => setEditingMember({...editingMember, email: e.target.value})} placeholder="john@example.com" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Phone *</label>
              <input type="tel" value={editingMember.phone} onChange={(e) => setEditingMember({...editingMember, phone: e.target.value})} placeholder="(555) 123-4567" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Hourly Rate ($) *</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={editingMember.hourlyRate} 
                onChange={(e) => setEditingMember({...editingMember, hourlyRate: e.target.value})} 
                placeholder="25.00" 
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
            </div>

            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setShowEditModal(false)} style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleUpdateMember} style={{flex:1, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Update Member
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
