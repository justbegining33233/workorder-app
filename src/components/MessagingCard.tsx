'use client';

import { useEffect, useState } from 'react';

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  receiverId: string;
  receiverRole: string;
  receiverName: string;
  subject?: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  contactId: string;
  contactRole: string;
  contactName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
}

interface UnreadCounts {
  tech: number;
  manager: number;
  admin: number;
  customer: number;
  shop: number;
}

interface MessagingCardProps {
  userId: string;
  shopId: string;
}

export default function MessagingCard({ userId, shopId }: MessagingCardProps) {
  console.log('💬 MessagingCard props - userId:', userId, 'shopId:', shopId);
  const [activeTab, setActiveTab] = useState<'techs' | 'managers' | 'shopAdmin' | 'customers'>('techs');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    tech: 0,
    manager: 0,
    admin: 0,
    customer: 0,
    shop: 0,
  });
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // For composing new message
  const [newRecipient, setNewRecipient] = useState({ id: '', name: '', role: '' });
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);

  useEffect(() => {
    if (shopId && userId) {
      console.log('🔄 Component mounted with shopId:', shopId, 'userId:', userId);
      fetchMessages();
      fetchAvailableContacts();
    }
    
    // Refresh messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, userId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found - skipping message fetch. User may need to log in again.');
        setAuthError(true);
        return;
      }
      
      const response = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 401) {
        console.warn('⚠️ Token invalid or expired (401) - authentication required');
        setAuthError(true);
        return;
      }
      
      if (response.ok) {
        const { conversations: convs, unreadByRole } = await response.json();
        setConversations(convs);
        setUnreadCounts(unreadByRole);
        setAuthError(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAvailableContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ No token available for fetching contacts');
        setAuthError(true);
        return;
      }
      
      if (!shopId) {
        console.log('⚠️ No shopId available for fetching contacts');
        return;
      }
      
      let contacts: any[] = [];
      
      // Fetch techs from the same shop
      console.log('📞 Fetching techs from shop:', shopId);
      const techsRes = await fetch(`/api/techs?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (techsRes.status === 401) {
        console.log('❌ Token invalid or expired (401) when fetching techs');
        setAuthError(true);
        return;
      }
      
      if (techsRes.ok) {
        const { techs } = await techsRes.json();
        console.log('✅ Techs fetched:', techs.length);
        // Filter out the current user from the list
        const otherUsers = techs.filter((t: any) => t.id !== userId);
        contacts = otherUsers.map((t: any) => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName} (${t.role === 'manager' ? 'Manager' : 'Tech'})`,
          role: t.role,
        }));
      } else {
        console.log('❌ Failed to fetch techs:', techsRes.status);
      }
      
      // Fetch shop owner/admin (managers can only message shop admin, not system admin)
      console.log('📞 Fetching shop details:', shopId);
      const shopRes = await fetch(`/api/shop?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (shopRes.status === 401) {
        console.log('❌ Token invalid or expired (401) when fetching shop');
        setAuthError(true);
        return;
      }
      
      if (shopRes.ok) {
        const { shop } = await shopRes.json();
        console.log('✅ Shop fetched:', shop.shopName);
        contacts.push({
          id: shop.id,
          name: `${shop.shopName} (Shop Owner)`,
          role: 'shop',
        });
      } else {
        console.log('❌ Failed to fetch shop:', shopRes.status);
      }
      
      console.log('📋 Available contacts:', contacts);
      setAvailableContacts(contacts);
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
    }
  };

  const getFilteredConversations = () => {
    let roleFilter = 'customer';
    if (activeTab === 'techs') roleFilter = 'tech';
    else if (activeTab === 'managers') roleFilter = 'manager';
    else if (activeTab === 'shopAdmin') roleFilter = 'shop';
    return conversations.filter((c) => c.contactRole === roleFilter);
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowCompose(false);
    
    // Mark messages as read
    if (conv.unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/messages', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contactId: conv.contactId,
            contactRole: conv.contactRole,
          }),
        });
        
        // Refresh messages
        fetchMessages();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    let receiverId = '';
    let receiverName = '';
    let receiverRole = '';
    
    if (showCompose && newRecipient.id) {
      receiverId = newRecipient.id;
      receiverName = newRecipient.name;
      receiverRole = newRecipient.role;
    } else if (selectedConversation) {
      receiverId = selectedConversation.contactId;
      receiverName = selectedConversation.contactName;
      receiverRole = selectedConversation.contactRole;
    } else {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId,
          receiverName,
          receiverRole,
          messageBody: messageText,
        }),
      });
      
      if (response.ok) {
        setMessageText('');
        setShowCompose(false);
        setNewRecipient({ id: '', name: '', role: '' });
        fetchMessages();
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = getFilteredConversations();

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Authentication Error Banner */}
      {authError && (
        <div style={{
          padding: 16,
          background: 'rgba(239,68,68,0.2)',
          borderBottom: '1px solid rgba(239,68,68,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#fca5a5', fontWeight: 600, margin: 0, fontSize: 14 }}>
              Session Expired or Missing
            </p>
            <p style={{ color: '#f87171', margin: 0, fontSize: 12, marginTop: 4 }}>
              Please sign out and log back in to restore messaging functionality.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/auth/login';
            }}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Log Out
          </button>
        </div>
      )}
      
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>💬 Messages</h2>
          <button
            onClick={() => {
              console.log('🆕 New button clicked, fetching contacts...');
              setShowCompose(true);
              setSelectedConversation(null);
              fetchAvailableContacts();
            }}
            style={{
              padding: '6px 12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + New
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['techs', 'managers', 'shopAdmin', 'customers'] as const).map((tab) => {
            const getUnreadCount = () => {
              if (tab === 'techs') return unreadCounts.tech;
              if (tab === 'managers') return unreadCounts.manager;
              if (tab === 'shopAdmin') return unreadCounts.admin + unreadCounts.shop;
              if (tab === 'customers') return unreadCounts.customer;
              return 0;
            };
            const unreadCount = getUnreadCount();
            
            return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: activeTab === tab ? 'rgba(229,51,42,0.2)' : 'rgba(255,255,255,0.05)',
                border: activeTab === tab ? '1px solid #e5332a' : '1px solid transparent',
                borderRadius: 6,
                color: activeTab === tab ? '#e5332a' : '#9aa3b2',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {tab === 'techs' ? '👷 Techs' : tab === 'managers' ? '👔 Managers' : tab === 'shopAdmin' ? '🏪 Shop Admin' : '👤 Customers'}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#e5332a',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', height: 400 }}>
        {/* Conversations List */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
              No conversations yet
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={`${conv.contactRole}_${conv.contactId}`}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding: 16,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  background: selectedConversation?.contactId === conv.contactId ? 'rgba(229,51,42,0.1)' : 'transparent',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, color: '#e5e7eb', fontSize: 14 }}>{conv.contactName}</div>
                  {conv.unreadCount > 0 && (
                    <span style={{
                      background: '#e5332a',
                      color: 'white',
                      borderRadius: 12,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#9aa3b2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage.substring(0, 50)}...
                </div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                  {new Date(conv.lastMessageAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Thread / Compose */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {showCompose ? (
            // Compose new message
            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', color: '#e5e7eb', fontSize: 13, marginBottom: 4 }}>To:</label>
                <select
                  value={newRecipient.id}
                  onChange={(e) => {
                    const contact = availableContacts.find((c) => c.id === e.target.value);
                    if (contact) {
                      setNewRecipient(contact);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    fontSize: 13,
                  }}
                >
                  <option value="">Select recipient...</option>
                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({contact.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  fontSize: 13,
                  resize: 'none',
                  marginBottom: 12,
                }}
              />
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !messageText.trim() || !newRecipient.id}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: loading || !messageText.trim() || !newRecipient.id ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    opacity: loading || !messageText.trim() || !newRecipient.id ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                <button
                  onClick={() => {
                    setShowCompose(false);
                    setMessageText('');
                    setNewRecipient({ id: '', name: '', role: '' });
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedConversation ? (
            // Show conversation thread
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedConversation.messages
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((msg) => {
                    const isSent = msg.senderId === userId;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isSent ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                        }}
                      >
                        <div
                          style={{
                            background: isSent ? 'rgba(229,51,42,0.2)' : 'rgba(59,130,246,0.2)',
                            border: `1px solid ${isSent ? 'rgba(229,51,42,0.4)' : 'rgba(59,130,246,0.4)'}`,
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <div style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 4 }}>{msg.body}</div>
                          <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Reply box */}
              <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    placeholder="Type your reply..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(0,0,0,0.3)',
                      color: 'white',
                      fontSize: 13,
                      resize: 'none',
                      minHeight: 60,
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !messageText.trim()}
                    style={{
                      padding: '10px 20px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: loading || !messageText.trim() ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      opacity: loading || !messageText.trim() ? 0.5 : 1,
                    }}
                  >
                    {loading ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // No conversation selected
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14 }}>
              Select a conversation or compose a new message
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
