'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Message = {
  id: string;
  sender: string;
  role: string;
  message: string;
  time: Date;
  workOrder?: string;
  unread: boolean;
};

export default function TechMessages() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reply, setReply] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    if (role !== 'tech' && role !== 'manager') {
      router.push('/auth/login');
      return;
    }
    if (name) setUserName(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTimeAgo = (date: Date) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return '#8b5cf6';
      case 'customer': return '#3b82f6';
      case 'shop': return '#22c55e';
      default: return '#9aa3b2';
    }
  };

  const handleSendReply = () => {
    if (!reply.trim()) return;
    alert('Reply sent!');
    setReply('');
    setSelectedMessage(null);
  };

  const markAsRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? {...m, unread: false} : m));
  };

  const filteredMessages = filterUnread ? messages.filter(m => m.unread) : messages;
  const unreadCount = messages.filter(m => m.unread).length;

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/tech/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>💬 Messages</h1>
              <p style={{fontSize:14, color:'#9aa3b2'}}>Communication center for work orders and updates</p>
            </div>
            {unreadCount > 0 && (
              <div style={{padding:'8px 16px', background:'rgba(229,51,42,0.2)', color:'#e5332a', borderRadius:8, fontSize:14, fontWeight:700}}>
                {unreadCount} Unread
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:24}}>
          {/* Message List */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, height:'fit-content'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <h2 style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>Inbox</h2>
              <button 
                onClick={() => setFilterUnread(!filterUnread)}
                style={{padding:'6px 12px', background:filterUnread ? 'rgba(229,51,42,0.2)' : 'rgba(255,255,255,0.1)', color:filterUnread ? '#e5332a' : '#9aa3b2', border:`1px solid ${filterUnread ? 'rgba(229,51,42,0.3)' : 'rgba(255,255,255,0.2)'}`, borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}
              >
                {filterUnread ? 'Show All' : 'Unread Only'}
              </button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {filteredMessages.map(msg => (
                <div 
                  key={msg.id}
                  onClick={() => { setSelectedMessage(msg); markAsRead(msg.id); }}
                  style={{padding:16, background:msg.unread ? 'rgba(229,51,42,0.1)' : 'rgba(255,255,255,0.05)', border:`1px solid ${msg.unread ? 'rgba(229,51,42,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer'}}
                >
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{fontSize:14, fontWeight:700, color:'#e5e7eb'}}>{msg.sender}</span>
                      {msg.unread && <span style={{width:8, height:8, background:'#e5332a', borderRadius:'50%'}} />}
                    </div>
                    <span style={{padding:'2px 8px', background:`rgba(${parseInt(getRoleColor(msg.role).slice(1,3),16)},${parseInt(getRoleColor(msg.role).slice(3,5),16)},${parseInt(getRoleColor(msg.role).slice(5,7),16)},0.2)`, color:getRoleColor(msg.role), borderRadius:6, fontSize:10, fontWeight:600}}>
                      {msg.role.toUpperCase()}
                    </span>
                  </div>
                  <p style={{fontSize:13, color:'#9aa3b2', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{msg.message}</p>
                  <div style={{fontSize:11, color:'#6b7280'}}>{getTimeAgo(msg.time)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Detail */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            {!selectedMessage ? (
              <div style={{textAlign:'center', padding:80, color:'#9aa3b2'}}>
                <div style={{fontSize:64, marginBottom:16}}>💬</div>
                <p style={{fontSize:16}}>Select a message to view details</p>
              </div>
            ) : (
              <div>
                <div style={{borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:20, marginBottom:20}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                    <div>
                      <h2 style={{fontSize:22, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{selectedMessage.sender}</h2>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span style={{padding:'3px 10px', background:`rgba(${parseInt(getRoleColor(selectedMessage.role).slice(1,3),16)},${parseInt(getRoleColor(selectedMessage.role).slice(3,5),16)},${parseInt(getRoleColor(selectedMessage.role).slice(5,7),16)},0.2)`, color:getRoleColor(selectedMessage.role), borderRadius:6, fontSize:11, fontWeight:600}}>
                          {selectedMessage.role.toUpperCase()}
                        </span>
                        {selectedMessage.workOrder && (
                          <span style={{fontSize:12, color:'#9aa3b2'}}>• Work Order: <Link href={`/workorders/${selectedMessage.workOrder}`} style={{color:'#3b82f6', textDecoration:'none'}}>{selectedMessage.workOrder}</Link></span>
                        )}
                      </div>
                    </div>
                    <div style={{textAlign:'right', fontSize:13, color:'#6b7280'}}>
                      {new Date(selectedMessage.time).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:20, marginBottom:24}}>
                  <p style={{fontSize:15, color:'#e5e7eb', lineHeight:1.6}}>{selectedMessage.message}</p>
                </div>

                <div>
                  <h3 style={{fontSize:16, fontWeight:700, color:'#e5e7eb', marginBottom:12}}>Reply</h3>
                  <textarea 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                    style={{width:'100%', padding:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14, resize:'vertical', marginBottom:12}}
                  />
                  <div style={{display:'flex', gap:12}}>
                    <button onClick={handleSendReply} style={{flex:1, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                      Send Reply
                    </button>
                    <button onClick={() => setSelectedMessage(null)} style={{padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                      Close
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
