"use client";

import { useEffect, useMemo, useState } from "react";

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  receiverId: string;
  receiverRole: string;
  receiverName: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  contactId: string;
  contactName: string;
  contactRole?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
  shopId?: string;
}

interface CustomerMessagingCardProps {
  header?: string;
  initialShopId?: string;
}

export default function CustomerMessagingCard({ header = "Messages", initialShopId }: CustomerMessagingCardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Only show customer conversations
  const customerConversations = useMemo(
    () => conversations.filter((c) => c.contactRole === "customer"),
    [conversations]
  );
  const customerTabs = useMemo(
    () => customerConversations.map((c) => ({ id: c.shopId || c.contactId, name: c.contactName || "Customer" })),
    [customerConversations]
  );
  const [activeShopId, setActiveShopId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeShopId && (customerTabs.length > 0 || initialShopId)) {
      const initial = initialShopId && customerTabs.find((s) => s.id === initialShopId);
      setActiveShopId((initial && initial.id) || initialShopId || customerTabs[0]?.id || null);
    }
  }, [customerTabs, activeShopId, initialShopId]);

  useEffect(() => {
    if (activeShopId) {
      const conv = conversations.find((c) => (c.shopId || c.contactId) === activeShopId);
      setSelected(conv || null);
    }
  }, [activeShopId, conversations]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthError(true);
        return;
      }

      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setAuthError(true);
        return;
      }

      const data = await res.json();
      const convs = (data.conversations || []).map((c: any) => ({
        ...c,
        shopId: c.shopId || c.contactId,
      }));

      setConversations(convs);
      setAuthError(false);
    } catch (err) {
      console.error("Failed to fetch customer messages", err);
    }
  };

  const handleSend = async () => {
    const targetShopId = selected?.shopId || selected?.contactId || initialShopId;
    if (!messageText.trim() || !targetShopId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: targetShopId,
          receiverRole: "shop",
          receiverName: selected?.contactName || "Shop",
          messageBody: messageText.trim(),
        }),
      });

      if (res.ok) {
        setMessageText("");
        fetchMessages();
      }
    } catch (err) {
      console.error("Send message failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
      {authError && (
        <div style={{ padding: 12, background: "rgba(239,68,68,0.15)", color: "#fecdd3", fontSize: 12 }}>
          Session expired. Please sign in again.
        </div>
      )}

      <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, color: "#e5e7eb", fontSize: 16, fontWeight: 700 }}>{header}</h3>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: 12 }}>Chat with your customers</p>
        </div>
        <span style={{ color: "#9ca3af", fontSize: 12 }}>{customerTabs.length} customers</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", minHeight: 320 }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto" }}>
          {customerTabs.length === 0 ? (
            <div style={{ padding: 20, color: "#9ca3af", fontSize: 12 }}>No customer conversations yet.</div>
          ) : (
            customerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveShopId(tab.id)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  textAlign: "left",
                  background: activeShopId === tab.id ? "rgba(59,130,246,0.12)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: activeShopId === tab.id ? "#bfdbfe" : "#e5e7eb",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {tab.name}
              </button>
            ))
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", minHeight: 320 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {selected ? (
              selected.messages
                .slice()
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((msg) => (
                  <div key={msg.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
                      {msg.senderRole === "customer" ? "You" : msg.senderName} • {new Date(msg.createdAt).toLocaleString()}
                    </div>
                    <div style={{ background: msg.senderRole === "customer" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)", color: "#e5e7eb", padding: "8px 10px", borderRadius: 8, fontSize: 13 }}>
                      {msg.body}
                    </div>
                  </div>
                ))
            ) : (
              <div style={{ color: "#9ca3af", fontSize: 12 }}>Select a customer to view messages.</div>
            )}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: 12, display: "flex", gap: 8 }}>
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={selected || initialShopId ? "Type your message" : "Select a customer first"}
              disabled={loading || (!selected && !initialShopId)}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#e5e7eb", fontSize: 13 }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !messageText.trim() || (!selected && !initialShopId)}
              style={{ padding: "10px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: (selected || initialShopId) && messageText.trim() && !loading ? "pointer" : "not-allowed" }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
