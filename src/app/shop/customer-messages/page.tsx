'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  customerName: string;
  workOrderId?: string;
  subject: string;
  message: string;
  timestamp: Date;
  status: 'unread' | 'read' | 'replied';
  priority: 'normal' | 'urgent';
}

export default function CustomerMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  useEffect(() => {
    const role = localStorage.getItem('userRole');

    if (role !== 'shop') {
      router.push('/auth/login');
      return;
    }

    loadMessages();
  }, [router]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const shopId = localStorage.getItem('shopId');
      
      const response = await fetch(`/api/messages?shopId=${shopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.map((msg: any) => ({
          id: msg.id,
          customerName: msg.customer ? `${msg.customer.firstName} ${msg.customer.lastName}` : 'Unknown',
          workOrderId: msg.workOrderId,
          subject: msg.subject,
          message: msg.message,
          timestamp: new Date(msg.createdAt),
          status: msg.status,
          priority: msg.priority || 'normal'
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedMessage) return;
    
    try {
      const token = localStorage.getItem('token');
      const shopId = localStorage.getItem('shopId');
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedMessage.id, // This needs proper customer ID mapping
          shopId,
          subject: `Re: ${selectedMessage.subject}`,
          message: reply,
          workOrderId: selectedMessage.workOrderId
        }),
      });

      if (response.ok) {
        alert('Reply sent successfully!');
        setReply('');
        setSelectedMessage(null);
        loadMessages(); // Reload messages
      } else {
        alert('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return msg.status === 'unread';
    if (filter === 'urgent') return msg.priority === 'urgent';
    return true;
  });

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/shop/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:8, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>💬 Customer Messages</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>View and respond to customer inquiries</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gridTemplateColumns:'350px 1fr', gap:24, minHeight:'70vh'}}>
          {/* Messages List */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:16, overflowY:'auto'}}>
            {/* Filters */}
            <div style={{display:'flex', gap:8, marginBottom:16}}>
              <button onClick={() => setFilter('all')} style={{flex:1, padding:'8px', background:filter === 'all' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color:filter === 'all' ? '#3b82f6' : '#9aa3b2', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                All
              </button>
              <button onClick={() => setFilter('unread')} style={{flex:1, padding:'8px', background:filter === 'unread' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', color:filter === 'unread' ? '#f59e0b' : '#9aa3b2', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                Unread
              </button>
              <button onClick={() => setFilter('urgent')} style={{flex:1, padding:'8px', background:filter === 'urgent' ? 'rgba(229,51,42,0.2)' : 'rgba(255,255,255,0.05)', color:filter === 'urgent' ? '#e5332a' : '#9aa3b2', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                Urgent
              </button>
            </div>

            {/* Message List */}
            {filteredMessages.length === 0 ? (
              <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
                <div style={{fontSize:48, marginBottom:16}}>📭</div>
                <p>No messages yet</p>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    onClick={() => setSelectedMessage(msg)}
                    style={{
                      padding:12, 
                      background: selectedMessage?.id === msg.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', 
                      border: selectedMessage?.id === msg.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)', 
                      borderRadius:8, 
                      cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                      <span style={{fontSize:14, fontWeight:700, color:'#e5e7eb'}}>{msg.customerName}</span>
                      {msg.status === 'unread' && (
                        <span style={{width:8, height:8, background:'#3b82f6', borderRadius:'50%'}}></span>
                      )}
                    </div>
                    <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>{msg.subject}</div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontSize:11, color:'#6b7280'}}>{msg.timestamp.toLocaleDateString()}</span>
                      {msg.priority === 'urgent' && (
                        <span style={{padding:'2px 8px', background:'rgba(229,51,42,0.2)', color:'#e5332a', borderRadius:8, fontSize:10, fontWeight:700}}>URGENT</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Details */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            {!selectedMessage ? (
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#9aa3b2', textAlign:'center'}}>
                <div>
                  <div style={{fontSize:64, marginBottom:16}}>💬</div>
                  <p>Select a message to view details</p>
                </div>
              </div>
            ) : (
              <div>
                <div style={{marginBottom:24, paddingBottom:24, borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                    <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>{selectedMessage.subject}</h2>
                    {selectedMessage.priority === 'urgent' && (
                      <span style={{padding:'4px 12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', borderRadius:12, fontSize:12, fontWeight:700}}>URGENT</span>
                    )}
                  </div>
                  <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>
                    From: <span style={{color:'#e5e7eb', fontWeight:600}}>{selectedMessage.customerName}</span>
                  </div>
                  {selectedMessage.workOrderId && (
                    <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>
                      Work Order: <Link href={`/workorders/${selectedMessage.workOrderId}`} style={{color:'#3b82f6', textDecoration:'none'}}>{selectedMessage.workOrderId}</Link>
                    </div>
                  )}
                  <div style={{fontSize:12, color:'#6b7280'}}>{selectedMessage.timestamp.toLocaleString()}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <h3 style={{fontSize:14, fontWeight:600, color:'#9aa3b2', marginBottom:12}}>Message</h3>
                  <div style={{padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8, color:'#e5e7eb', lineHeight:1.6}}>
                    {selectedMessage.message}
                  </div>
                </div>

                <div>
                  <h3 style={{fontSize:14, fontWeight:600, color:'#9aa3b2', marginBottom:12}}>Reply</h3>
                  <textarea 
                    value={reply} 
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your response..."
                    style={{width:'100%', minHeight:120, padding:12, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#e5e7eb', fontSize:14, resize:'vertical'}}
                  />
                  <button 
                    onClick={handleSendReply}
                    style={{marginTop:12, padding:'12px 24px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
