// src/conversation/TalkToAdmin.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ImagePlus, Trash2, Pencil, X } from 'lucide-react';
import { supabase } from '../supabase/supabase-client';
import '../conversation/TalkToAdmin.css';
import talkToAdminIcon from '../assets/images/talktoadmin.png';
import DeleteMessage from '../assets/images/maya-bird-delete.png';

// ---------- Types ----------

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_path: string | null;
  created_at: string;
  read_at: string | null;
}

interface TalkToAdminProps {
  farmerId: string;
  adminId?: string;
}

interface AdminPresence {
  user_id?: string;
  online_at?: string;
}

// ---------- Constants ----------

const CHAT_IMAGE_BUCKET = 'chat-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PRESENCE_CHANNEL = 'online-admins';

const FALLBACK_ADMIN_ID = import.meta.env.VITE_DEFAULT_ADMIN_ID as
  | string
  | undefined;

// ---------- Helpers ----------

async function signPaths(
  bucket: string,
  paths: string[],
): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(paths.filter(Boolean)));
  if (uniq.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(uniq, 60 * 60);

  if (error || !data) {
    console.error('Could not create signed image URLs:', error);
    return {};
  }

  const map: Record<string, string> = {};

  for (const row of data) {
    if (row.path && row.signedUrl) {
      map[row.path] = row.signedUrl;
    }
  }

  return map;
}

function makeTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Component ----------

export default function TalkToAdmin({
  farmerId,
  adminId,
}: TalkToAdminProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [resolvedAdminId, setResolvedAdminId] = useState<string | null>(
    adminId ?? FALLBACK_ADMIN_ID ?? null,
  );

  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );

  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Admin online status
  const [adminOnline, setAdminOnline] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const pendingTempIdsRef = useRef<Set<string>>(new Set());

  const activeAdminId = useMemo(
    () => resolvedAdminId ?? FALLBACK_ADMIN_ID ?? null,
    [resolvedAdminId],
  );

  // ---------- Resolve admin ----------

  useEffect(() => {
    if (adminId || FALLBACK_ADMIN_ID) {
      setResolvedAdminId(adminId ?? FALLBACK_ADMIN_ID ?? null);
      return;
    }

    let cancelled = false;

    const resolveAdmin = async () => {
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

      if (data?.id) {
        setResolvedAdminId(data.id);
      }
    };

    void resolveAdmin();

    return () => {
      cancelled = true;
    };
  }, [adminId]);

  // ---------- Admin online presence ----------
  // Same auto-reconnect pattern as the message subscription.

  useEffect(() => {
    if (!activeAdminId) {
      setAdminOnline(false);
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    const updateAdminStatus = () => {
      if (!presenceChannel) return;
      const state = presenceChannel.presenceState();

      const online = Object.values(state)
        .flat()
        .some((entry) => {
          const presence = entry as AdminPresence;
          return presence.user_id === activeAdminId;
        });

      if (!cancelled) {
        setAdminOnline(online);
      }
    };

    const connect = () => {
      if (cancelled) return;

      presenceChannel = supabase.channel(PRESENCE_CHANNEL);

      presenceChannel
        .on('presence', { event: 'sync' }, updateAdminStatus)
        .on('presence', { event: 'join' }, updateAdminStatus)
        .on('presence', { event: 'leave' }, updateAdminStatus)
        .subscribe((status) => {
          if (cancelled) return;

          if (status === 'SUBSCRIBED') {
            attempt = 0;
            updateAdminStatus();
          } else if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            setAdminOnline(false);
            console.error('Admin presence connection status:', status);

            // Clean up the dead channel and try again
            if (presenceChannel) {
              void supabase.removeChannel(presenceChannel);
              presenceChannel = null;
            }

            attempt += 1;
            const delay = Math.min(1000 * 2 ** attempt, 30000);
            retryTimer = setTimeout(connect, delay);
          }
        });
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (presenceChannel) void supabase.removeChannel(presenceChannel);
    };
  }, [activeAdminId]);

  // ---------- Auto-scroll ----------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // ---------- Load and subscribe to messages ----------

  useEffect(() => {
    if (!isOpen || !farmerId || !activeAdminId) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const fetchMessages = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${farmerId},receiver_id.eq.${activeAdminId}),and(sender_id.eq.${activeAdminId},receiver_id.eq.${farmerId})`,
        )
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as Message[];
      setMessages(rows);

      const paths = rows
        .map((message) => message.image_path ?? '')
        .filter(Boolean);

      if (paths.length > 0) {
        const urls = await signPaths(CHAT_IMAGE_BUCKET, paths);

        if (!cancelled) {
          setImageUrls((previous) => ({ ...previous, ...urls }));
        }
      }

      if (cancelled) return;

      const unreadIds = rows
        .filter(
          (message) =>
            message.receiver_id === farmerId && message.read_at === null,
        )
        .map((message) => message.id);

      if (unreadIds.length > 0) {
        const { error: readError } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);

        if (readError) {
          console.error('Could not mark messages as read:', readError);
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    void fetchMessages();

    const setupSubscription = () => {
      if (cancelled) return;

      subscription = supabase
        .channel(`messages-${farmerId}-${activeAdminId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const incoming = payload.new as Message;

            const belongsToThisChat =
              (incoming.sender_id === farmerId &&
                incoming.receiver_id === activeAdminId) ||
              (incoming.sender_id === activeAdminId &&
                incoming.receiver_id === farmerId);

            if (!belongsToThisChat) return;

            if (incoming.image_path) {
              const path = incoming.image_path;

              setImageUrls((previous) => {
                if (previous[path]) return previous;

                void signPaths(CHAT_IMAGE_BUCKET, [path]).then((urls) => {
                  if (urls[path]) {
                    setImageUrls((current) => ({
                      ...current,
                      ...urls,
                    }));
                  }
                });

                return previous;
              });
            }

            setMessages((previous) => {
              if (previous.some((message) => message.id === incoming.id)) {
                return previous;
              }

              const temp = previous.find(
                (message) =>
                  pendingTempIdsRef.current.has(message.id) &&
                  message.sender_id === incoming.sender_id &&
                  message.receiver_id === incoming.receiver_id &&
                  (message.content || '') === (incoming.content || '') &&
                  (message.image_path ?? null) ===
                    (incoming.image_path ?? null),
              );

              if (temp) {
                pendingTempIdsRef.current.delete(temp.id);

                return previous.map((message) =>
                  message.id === temp.id ? incoming : message,
                );
              }

              return [...previous, incoming];
            });

            if (
              incoming.receiver_id === farmerId &&
              incoming.read_at === null
            ) {
              void supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', incoming.id);
            }
          },
        )
        .subscribe((status) => {
          if (cancelled) return;

          if (status === 'SUBSCRIBED') {
            attempt = 0;
            // Re-fetch to catch anything that arrived while disconnected
            void fetchMessages();
          } else if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            console.error('Message subscription status:', status);

            // Clean up the dead channel to prevent connection leaks
            if (subscription) {
              void supabase.removeChannel(subscription);
              subscription = null;
            }

            // Exponential backoff: 2s, 4s, 8s, ... up to 30s
            attempt += 1;
            const delay = Math.min(1000 * 2 ** attempt, 30000);

            retryTimer = setTimeout(setupSubscription, delay);
          }
        });
    };

    setupSubscription();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (subscription) void supabase.removeChannel(subscription);
    };
  }, [isOpen, farmerId, activeAdminId]);

  // ---------- Image picker ----------

  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image must be smaller than 5 MB.');
      return;
    }

    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
  };

  const clearPendingImage = () => {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl);
    }

    setPendingImage(null);
  };

  // ---------- Send message ----------

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (sendingRef.current) return;
    sendingRef.current = true;

    const trimmed = newMessage.trim();
    const hasImage = Boolean(pendingImage);

    if ((!trimmed && !hasImage) || !farmerId) {
      sendingRef.current = false;
      return;
    }

    const targetAdminId = activeAdminId;

    if (!targetAdminId) {
      sendingRef.current = false;

      alert(
        'No admin is configured yet. Please contact the system administrator.',
      );

      return;
    }

    const content = trimmed;
    const imageToSend = pendingImage;

    setSending(true);
    setUploading(Boolean(imageToSend));
    setNewMessage('');
    setPendingImage(null);

    if (imageToSend) {
      URL.revokeObjectURL(imageToSend.previewUrl);
    }

    let imagePath: string | null = null;
    let tempId: string | null = null;

    try {
      if (imageToSend) {
        const ext = imageToSend.file.name.split('.').pop() || 'jpg';

        const path = `${farmerId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(CHAT_IMAGE_BUCKET)
          .upload(path, imageToSend.file, {
            upsert: false,
            contentType: imageToSend.file.type,
          });

        if (uploadError) throw uploadError;

        imagePath = path;

        const urls = await signPaths(CHAT_IMAGE_BUCKET, [path]);

        if (urls[path]) {
          setImageUrls((previous) => ({
            ...previous,
            [path]: urls[path],
          }));
        }
      }

      const payload = {
        sender_id: farmerId,
        receiver_id: targetAdminId,
        content,
        image_path: imagePath,
      };

      tempId = makeTempId();
      pendingTempIdsRef.current.add(tempId);

      const optimistic: Message = {
        id: tempId,
        ...payload,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setMessages((previous) => [...previous, optimistic]);

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (inserted) {
        const insertedMessage = inserted as Message;

        setMessages((previous) => {
          if (previous.some((message) => message.id === insertedMessage.id)) {
            return previous.filter((message) => message.id !== tempId);
          }

          return previous.map((message) =>
            message.id === tempId ? insertedMessage : message,
          );
        });

        pendingTempIdsRef.current.delete(tempId);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      if (tempId) {
        pendingTempIdsRef.current.delete(tempId);

        setMessages((previous) =>
          previous.filter((message) => message.id !== tempId),
        );
      }

      alert(
        `Failed to send message.\n\n${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
      setUploading(false);
    }
  };

  // ---------- Edit message ----------

  const startEdit = (message: Message) => {
    if (message.sender_id !== farmerId) return;
    if (message.image_path) return;
    if (message.id.startsWith('temp-')) return;

    setEditingId(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    const id = editingId;
    const nextContent = editContent.trim();
    const previousMessages = messages;

    setMessages((previous) =>
      previous.map((message) =>
        message.id === id
          ? { ...message, content: nextContent }
          : message,
      ),
    );

    setEditingId(null);
    setEditContent('');

    const { error } = await supabase
      .from('messages')
      .update({ content: nextContent })
      .eq('id', id)
      .eq('sender_id', farmerId);

    if (error) {
      console.error('Error editing message:', error);
      setMessages(previousMessages);
      alert(`Failed to edit message.\n\n${error.message}`);
    }
  };

  // ---------- Delete one message ----------

  const confirmDeleteMessage = async () => {
    if (!deletingMessageId) return;

    const id = deletingMessageId;
    const previousMessages = messages;
    const target = previousMessages.find((message) => message.id === id);

    setDeletingMessageId(null);

    setMessages((previous) =>
      previous.filter((message) => message.id !== id),
    );

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('sender_id', farmerId);

    if (error) {
      console.error('Error deleting message:', error);
      setMessages(previousMessages);
      alert(`Failed to delete message.\n\n${error.message}`);
      return;
    }

    if (target?.image_path) {
      const { error: storageError } = await supabase.storage
        .from(CHAT_IMAGE_BUCKET)
        .remove([target.image_path]);

      if (storageError) {
        console.warn('Could not delete the image:', storageError);
      }

      setImageUrls((previous) => {
        const next = { ...previous };
        delete next[target.image_path!];
        return next;
      });
    }
  };

  // ---------- Delete entire conversation ----------

  const confirmDeleteAll = async () => {
    if (!farmerId || !activeAdminId || deletingAll) return;

    setDeletingAll(true);

    const previousMessages = messages;
    const previousImageUrls = imageUrls;

    const imagePaths = previousMessages
      .map((message) => message.image_path)
      .filter((path): path is string => Boolean(path));

    setMessages([]);
    setImageUrls({});
    setEditingId(null);
    setEditContent('');
    setDeletingMessageId(null);
    setActiveMessageId(null);
    setShowDeleteAllConfirm(false);

    try {
      const { error: dbError } = await supabase
        .from('messages')
        .delete()
        .or(
          `and(sender_id.eq.${farmerId},receiver_id.eq.${activeAdminId}),and(sender_id.eq.${activeAdminId},receiver_id.eq.${farmerId})`,
        );

      if (dbError) throw dbError;

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(CHAT_IMAGE_BUCKET)
          .remove(imagePaths);

        if (storageError) {
          console.warn(
            'Some chat images could not be deleted:',
            storageError,
          );
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);

      setMessages(previousMessages);
      setImageUrls(previousImageUrls);

      alert(
        `Failed to delete conversation.\n\n${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      setDeletingAll(false);
    }
  };

  // ---------- UI ----------

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

                <div className="admin-presence-status" aria-live="polite">
                  <span
                    className={`status-dot ${
                      adminOnline
                        ? 'status-dot--online'
                        : 'status-dot--offline'
                    }`}
                  />

                  <span>
                    {adminOnline ? 'Admin is online' : 'Admin is offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-delete-all-btn"
                onClick={() => setShowDeleteAllConfirm(true)}
                disabled={messages.length === 0 || deletingAll}
                aria-label="Delete entire conversation"
                title="Delete entire conversation"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: '6px',
                  padding: '6px',
                  marginRight: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor:
                    messages.length === 0 || deletingAll
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    messages.length === 0 || deletingAll ? 0.5 : 1,
                }}
              >
                <Trash2 size={16} color="#ffffff" />
              </button>

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
          </div>

          <div className="chat-messages">
            {loading ? (
              <p className="chat-empty">Loading messages…</p>
            ) : messages.length === 0 ? (
              <p className="chat-empty">
                No messages yet. Start a conversation!
              </p>
            ) : (
              messages.map((message) => {
                const isFarmer = message.sender_id === farmerId;

                const imgUrl = message.image_path
                  ? imageUrls[message.image_path]
                  : null;

                const isEditing = editingId === message.id;
                const isPending = message.id.startsWith('temp-');
                const isActive = activeMessageId === message.id;

                const canEdit =
                  isFarmer && !message.image_path && !isPending;

                const canDelete = isFarmer && !isPending;
                const showActions = (canEdit || canDelete) && !isEditing;

                return (
                  <div
                    key={message.id}
                    className={`message-row ${
                      isFarmer ? 'message-row--sent' : 'message-row--received'
                    } ${isActive ? 'message-row--active' : ''}`}
                    onClick={() => {
                      if (!showActions) return;

                      setActiveMessageId(isActive ? null : message.id);
                    }}
                  >
                    {showActions && (
                      <div className="message-actions">
                        {canEdit && (
                          <button
                            type="button"
                            className="message-action-btn"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEdit(message);
                            }}
                            aria-label="Edit message"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="message-action-btn message-action-btn--danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeletingMessageId(message.id);
                            }}
                            aria-label="Delete message"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    <div
                      className={`message-bubble ${
                        isFarmer ? 'message-sent' : 'message-received'
                      }`}
                    >
                      {imgUrl && (
                        <a
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="message-image-link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <img
                            src={imgUrl}
                            alt="Attachment"
                            className="message-image"
                          />
                        </a>
                      )}

                      {isEditing ? (
                        <div className="message-edit">
                          <textarea
                            className="message-edit-input"
                            value={editContent}
                            onChange={(event) =>
                              setEditContent(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === 'Enter' &&
                                !event.shiftKey
                              ) {
                                event.preventDefault();
                                void saveEdit();
                              }

                              if (event.key === 'Escape') {
                                cancelEdit();
                              }
                            }}
                            autoFocus
                            rows={2}
                          />

                          <div className="message-edit-actions">
                            <button
                              type="button"
                              className="message-edit-cancel"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="message-edit-save"
                              onClick={() => void saveEdit()}
                              disabled={!editContent.trim()}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        message.content && <p>{message.content}</p>
                      )}

                      <span className="message-time">
                        {new Date(message.created_at).toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {pendingImage && (
            <div className="chat-staged-image">
              <img src={pendingImage.previewUrl} alt="Selected" />

              <button
                type="button"
                className="chat-staged-remove"
                onClick={clearPendingImage}
                aria-label="Remove image"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              className="chat-attach-btn"
              onClick={handleImagePick}
              disabled={uploading || sending}
              aria-label="Attach image"
              title="Attach image"
            >
              <ImagePlus size={18} />
            </button>

            <input
              type="text"
              placeholder={
                uploading ? 'Uploading image…' : 'Type your message…'
              }
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              disabled={sending || uploading}
            />

            <button
              type="submit"
              disabled={
                (!newMessage.trim() && !pendingImage) ||
                sending ||
                uploading
              }
              aria-label="Send message"
            >
              <Send size={18} />
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 1 1 2 2z" />
        </svg>
      </button>

      {/* Delete one message confirmation */}
      {deletingMessageId && (
        <div
          className="talk-delete-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeletingMessageId(null);
            }
          }}
        >
          <div className="talk-delete-dialog" role="alertdialog">
            <div className="talk-delete-icon">
              <img src={DeleteMessage} alt="" aria-hidden="true" />
            </div>

            <h3>Delete this message?</h3>
            <p>This message will be permanently deleted.</p>

            <div className="talk-delete-actions">
              <button
                type="button"
                className="talk-delete-cancel"
                onClick={() => setDeletingMessageId(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="talk-delete-confirm"
                onClick={() => void confirmDeleteMessage()}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete entire conversation confirmation */}
      {showDeleteAllConfirm && (
        <div
          className="talk-delete-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deletingAll
            ) {
              setShowDeleteAllConfirm(false);
            }
          }}
        >
          <div className="talk-delete-dialog" role="alertdialog">
            <div className="talk-delete-icon">
              <img src={DeleteMessage} alt="" aria-hidden="true" />
            </div>

            <h3>Delete entire conversation?</h3>

            <p>
              All messages between you and the admin will be permanently
              deleted, including shared images. This action cannot be undone.
            </p>

            <div className="talk-delete-actions">
              <button
                type="button"
                className="talk-delete-cancel"
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={deletingAll}
              >
                Cancel
              </button>

              <button
                type="button"
                className="talk-delete-confirm"
                onClick={() => void confirmDeleteAll()}
                disabled={deletingAll}
              >
                {deletingAll ? 'Deleting…' : 'Yes, delete all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}