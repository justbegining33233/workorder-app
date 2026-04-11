'use client';

import Link from 'next/link';

interface TeamTabProps {
  teamData: any[];
}

export default function TeamTab({ teamData }: TeamTabProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#e5e7eb', fontSize: 24, margin: 0 }}>?? Team Management</h2>
        <Link href="/shop/manage-team" style={{
          padding: '10px 20px',
          background: 'rgba(59,130,246,0.2)',
          color: '#3b82f6',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 14
        }}>
          ? Add Team Member
        </Link>
      </div>

      {teamData.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>??</div>
          <div style={{ color: '#9aa3b2', fontSize: 16 }}>No team members found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {teamData.map((member: any) => (
            <div key={member.id} style={{
              background: 'rgba(255,255,255,0.05)',
              border: member.isClockedIn ? '2px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 24
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24 }}>
                {/* Member Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: member.role === 'manager' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20
                    }}>
                      {member.role === 'manager' ? '??' : '??'}
                    </div>
                    <div>
                      <div style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700 }}>{member.name}</div>
                      <div style={{ color: '#9aa3b2', fontSize: 13, marginTop: 2 }}>
                        {member.role === 'manager' ? 'Manager' : 'Technician'}
                      </div>
                    </div>
                  </div>
                  {member.isClockedIn && (
                    <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                      ?? Currently Clocked In
                    </div>
                  )}
                  <div style={{ color: '#9aa3b2', fontSize: 12 }}>?? {member.email}</div>
                  <div style={{ color: '#9aa3b2', fontSize: 12 }}>?? {member.phone || 'No phone'}</div>
                  {member.isClockedIn && member.clockedInLocation && (
                    <div style={{ color: '#9aa3b2', fontSize: 12, marginTop: 4 }}>?? {member.clockedInLocation}</div>
                  )}
                  {member.isClockedIn && member.clockedInNotes && (
                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>?? {member.clockedInNotes}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Weekly Hours</div>
                  <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 18 }}>
                    {(member.weeklyHours ?? 0).toFixed(1)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>Hourly Rate</div>
                  <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 16 }}>${member.hourlyRate || 0}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <Link
                  href={`/shop/admin/employee/${member.id}`}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(59,130,246,0.2)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  ?? View Profile
                </Link>
                <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                  Last active: {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Summary */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
          <div style={{ color: '#3b82f6', fontSize: 28, fontWeight: 700 }}>{teamData.length}</div>
          <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Members</div>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
          <div style={{ color: '#22c55e', fontSize: 28, fontWeight: 700 }}>
            {teamData.filter((m: any) => m.isClockedIn).length}
          </div>
          <div style={{ color: '#9aa3b2', fontSize: 12 }}>Clocked In Now</div>
        </div>
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
          <div style={{ color: '#8b5cf6', fontSize: 28, fontWeight: 700 }}>
            {teamData.reduce((sum: number, m: any) => sum + m.weeklyHours, 0).toFixed(1)}
          </div>
          <div style={{ color: '#9aa3b2', fontSize: 12 }}>Total Hours This Week</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
          <div style={{ color: '#f59e0b', fontSize: 28, fontWeight: 700 }}>
            {teamData.filter((m: any) => m.role === 'manager').length}
          </div>
          <div style={{ color: '#9aa3b2', fontSize: 12 }}>Managers</div>
        </div>
      </div>
    </div>
  );
}
