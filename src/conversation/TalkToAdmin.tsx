// src/conversation/TalkToAdmin.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabase-client';
import '../conversation/TalkToAdmin.css';
import talkToAdminIcon from '../assets/images/talktoadmin.png';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface TalkToAdminProps {
  farmerId: string;
  adminId?: string;
}

// Fallback admin UUID — set VITE_DEFAULT_ADMIN_ID in your .env file
const FALLBACK_ADMIN_ID = import.meta.env.VITE_DEFAULT_ADMIN_ID as
  | string
  | undefined;

export default function TalkToAdmin({ farmerId, adminId }: TalkToAdminProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resolvedAdminId, setResolvedAdminId] = useState<string | null>(
    adminId ?? FALLBACK_ADMIN_ID ?? null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---- Auto-resolve an admin from the `farmers` table ----
  useEffect(() => {
    if (resolvedAdminId) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Could not resolve admin:', error);
        return;
      }
      if (data?.id) setResolvedAdminId(data.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedAdminId]);

  // ---- Auto-scroll to latest message ----
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // ---- Load conversation + subscribe to real-time inserts ----
  useEffect(() => {
    if (!isOpen || !farmerId || !resolvedAdminId) return;

    let cancelled = false;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${farmerId},receiver_id.eq.${resolvedAdminId}),and(sender_id.eq.${resolvedAdminId},receiver_id.eq.${farmerId})`
        )
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data ?? []);
      }
      setLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages-${farmerId}-${resolvedAdminId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const incoming = payload.new as Message;

          const belongsToThisChat =
            (incoming.sender_id === farmerId &&
              incoming.receiver_id === resolvedAdminId) ||
            (incoming.sender_id === resolvedAdminId &&
              incoming.receiver_id === farmerId);

          if (!belongsToThisChat) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            const withoutTemp = prev.filter(
              (m) =>
                !(
                  m.id.startsWith('temp-') &&
                  m.content === incoming.content &&
                  m.sender_id === incoming.sender_id
                )
            );
            return [...withoutTemp, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [isOpen, farmerId, resolvedAdminId]);

  // ---- Send handler ----
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !farmerId) return;

    const targetAdminId = resolvedAdminId ?? FALLBACK_ADMIN_ID;
    if (!targetAdminId) {
      alert(
        'No admin is configured yet. Please contact the system administrator.'
      );
      return;
    }

    setSending(true);
    const content = newMessage.trim();
    const payload = {
      sender_id: farmerId,
      receiver_id: targetAdminId,
      content,
    };

    // Optimistic UI update — show message immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      ...payload,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert([payload]);

    if (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert(`Failed to send message.\n\n${error.message}`);
    }
    setSending(false);
  };

  return (
    <div className="talk-to-admin-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="admin-avatar">
                <img src={talkToAdminIcon} alt="" aria-hidden="true" />
              </div>
              <div>
                <h3>Talk to Admin</h3>
                <span className="status-dot"></span> Messages are saved
              </div>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {loading ? (
              <p className="chat-empty">Loading messages…</p>
            ) : messages.length === 0 ? (
              <p className="chat-empty">
                No messages yet. Start a conversation!
              </p>
            ) : (
              messages.map((msg) => {
                const isFarmer = msg.sender_id === farmerId;
                return (
                  <div
                    key={msg.id}
                    className={`message-bubble ${
                      isFarmer ? 'message-sent' : 'message-received'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type your message…"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={!newMessage.trim() || sending}>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        className={`chat-bubble-btn ${isOpen ? 'chat-bubble-btn--hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Talk to Admin"
        type="button"
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}