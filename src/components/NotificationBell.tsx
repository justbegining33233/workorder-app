'use client';

import { useEffect, useState } from 'react';
import { Notification } from '@/types/customer';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCustomerId(userId);
    }
  }, []);

  useEffect(() => {
    if (customerId) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [customerId]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?customerId=${customerId}`, { credentials: 'include' });
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const csrf = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1];
      await fetch(`/api/notifications?customerId=${customerId}&id=${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'x-csrf-token': csrf || '' },
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const csrf = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1];
      await fetch(`/api/notifications?customerId=${customerId}&action=markAllRead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'x-csrf-token': csrf || '' },
      });
      fetchNotifications();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      const csrf = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1];
      await fetch(`/api/notifications?customerId=${customerId}&id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-token': csrf || '' },
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{position:'relative'}}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn-outline"
        style={{position:'relative', padding:'8px 12px'}}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position:'absolute',
            top:'-4px',
            right:'-4px',
            background:'#e5332a',
            color:'white',
            borderRadius:'999px',
            width:'18px',
            height:'18px',
            fontSize:'10px',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontWeight:700
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position:'absolute',
          right:0,
          top:'calc(100% + 8px)',
          width:'360px',
          maxHeight:'500px',
          background:'#525252',
          border:'1px solid #5a5a5a',
          borderRadius:'12px',
          boxShadow:'0 10px 30px rgba(0,0,0,0.3)',
          zIndex:1000,
          overflow:'hidden'
        }}>
          <div style={{
            padding:'12px 16px',
            borderBottom:'1px solid #5a5a5a',
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center'
          }}>
            <div style={{fontWeight:700, fontSize:14}}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{fontSize:11, color:'#ff7a59', fontWeight:600}}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{maxHeight:'400px', overflowY:'auto'}}>
            {notifications.length === 0 ? (
              <div style={{padding:'40px 20px', textAlign:'center', color:'#9aa3b2', fontSize:13}}>
                No notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  style={{
                    padding:'12px 16px',
                    borderBottom:'1px solid #5a5a5a',
                    background: notif.read ? 'transparent' : 'rgba(229,51,42,0.08)',
                    cursor:'pointer'
                  }}
                >
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4}}>
                    <div style={{fontWeight:600, fontSize:13}}>{notif.title}</div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                      style={{fontSize:16, color:'#9aa3b2', lineHeight:1}}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{fontSize:12, color:'#b8beca', marginBottom:4}}>{notif.message}</div>
                  <div style={{fontSize:10, color:'#9aa3b2'}}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
