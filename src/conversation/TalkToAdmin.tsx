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

// ---------- Constants ----------

const CHAT_IMAGE_BUCKET = 'chat-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

function makeTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function TalkToAdmin({ farmerId, adminId }: TalkToAdminProps) {
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const pendingTempIdsRef = useRef<Set<string>>(new Set());

  const activeAdminId = useMemo(
    () => resolvedAdminId ?? FALLBACK_ADMIN_ID ?? null,
    [resolvedAdminId],
  );

  // ---- Resolve admin ----
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

  // ---- Auto-scroll ----
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // ---- Load + subscribe ----
  useEffect(() => {
    if (!isOpen || !farmerId || !activeAdminId) return;

    let cancelled = false;

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
      } else {
        const rows = data ?? [];
        setMessages(rows);

        const paths = rows.map((m) => m.image_path ?? '').filter(Boolean);
        if (paths.length > 0) {
          const urls = await signPaths(CHAT_IMAGE_BUCKET, paths);
          if (!cancelled) setImageUrls((prev) => ({ ...prev, ...urls }));
        }

        const unreadIds = rows
          .filter((m) => m.receiver_id === farmerId && m.read_at === null)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
        }
      }
      setLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages-${farmerId}-${activeAdminId}`)
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
            setImageUrls((prev) => {
              if (prev[incoming.image_path!]) return prev;
              signPaths(CHAT_IMAGE_BUCKET, [incoming.image_path!]).then(
                (urls) => setImageUrls((p) => ({ ...p, ...urls })),
              );
              return prev;
            });
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;

            const tempIds = pendingTempIdsRef.current;
            const temp = prev.find(
              (m) =>
                tempIds.has(m.id) &&
                m.sender_id === incoming.sender_id &&
                m.receiver_id === incoming.receiver_id &&
                (m.content || '') === (incoming.content || '') &&
                (m.image_path ?? null) === (incoming.image_path ?? null),
            );

            if (temp) {
              tempIds.delete(temp.id);
              return prev.map((m) => (m.id === temp.id ? incoming : m));
            }
            return [...prev, incoming];
          });

          if (incoming.receiver_id === farmerId && incoming.read_at === null) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', incoming.id)
              .then(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [isOpen, farmerId, activeAdminId]);

  // ---- Image picker ----
  const handleImagePick = () => fileInputRef.current?.click();

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image must be smaller than 5 MB.');
      return;
    }

    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
  };

  const clearPendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  // ---- Send ----
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sendingRef.current) return;
    sendingRef.current = true;

    const trimmed = newMessage.trim();
    const hasImage = !!pendingImage;

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
    setUploading(!!imageToSend);
    setNewMessage('');
    setPendingImage(null);
    if (imageToSend) URL.revokeObjectURL(imageToSend.previewUrl);

    let imagePath: string | null = null;

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

        const urls = await signPaths(CHAT_IMAGE_BUCKET, [path]);
        const signedUrl = urls[path];
        if (signedUrl) {
          setImageUrls((prev) => ({ ...prev, [path]: signedUrl }));
        }

        imagePath = path;
      }

      const payload = {
        sender_id: farmerId,
        receiver_id: targetAdminId,
        content,
        image_path: imagePath,
      };

      const tempId = makeTempId();
      pendingTempIdsRef.current.add(tempId);

      const optimistic: Message = {
        id: tempId,
        ...payload,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setMessages((prev) => [...prev, optimistic]);

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (inserted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === inserted.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? inserted : m));
        });
        pendingTempIdsRef.current.delete(tempId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert(
        `Failed to send message.\n\n${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
      );
      setMessages((prev) =>
        prev.filter((m) => !pendingTempIdsRef.current.has(m.id)),
      );
      pendingTempIdsRef.current.clear();
    } finally {
      sendingRef.current = false;
      setSending(false);
      setUploading(false);
    }
  };

  // ---- Edit ----
  const startEdit = (msg: Message) => {
    if (msg.sender_id !== farmerId) return;
    if (msg.image_path) return;
    if (msg.id.startsWith('temp-')) return;
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    const id = editingId;
    const nextContent = editContent.trim();
    const previous = messages;

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: nextContent } : m)),
    );
    setEditingId(null);
    setEditContent('');

    const { error } = await supabase
      .from('messages')
      .update({ content: nextContent })
      .eq('id', id);

    if (error) {
      console.error('Error editing message:', error);
      setMessages(previous);
      alert(`Failed to edit message.\n\n${error.message}`);
    }
  };

  // ---- Delete single ----
  const confirmDeleteMessage = async () => {
    if (!deletingMessageId) return;

    const id = deletingMessageId;
    const previous = messages;
    const target = previous.find((m) => m.id === id);

    setDeletingMessageId(null);
    setMessages((prev) => prev.filter((m) => m.id !== id));

    const { error } = await supabase.from('messages').delete().eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      setMessages(previous);
      alert(`Failed to delete message.\n\n${error.message}`);
      return;
    }

    if (target?.image_path) {
      await supabase.storage
        .from(CHAT_IMAGE_BUCKET)
        .remove([target.image_path]);
      setImageUrls((prev) => {
        const next = { ...prev };
        delete next[target.image_path!];
        return next;
      });
    }
  };

  // ---- Delete all ----
  const confirmDeleteAll = async () => {
    if (!farmerId || !activeAdminId) return;
    if (deletingAll) return;

    setDeletingAll(true);

    const previousMessages = messages;
    const previousImageUrls = imageUrls;

    const imagePaths = previousMessages
      .map((m) => m.image_path)
      .filter((p): p is string => !!p);

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
          console.warn('Some chat images could not be deleted:', storageError);
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setMessages(previousMessages);
      setImageUrls(previousImageUrls);
      alert(
        `Failed to delete conversation.\n\n${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
      );
    } finally {
      setDeletingAll(false);
    }
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
                  opacity: messages.length === 0 || deletingAll ? 0.5 : 1,
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
              messages.map((msg) => {
                const isFarmer = msg.sender_id === farmerId;
                const imgUrl = msg.image_path
                  ? imageUrls[msg.image_path]
                  : null;
                const isEditing = editingId === msg.id;
                const isPending = msg.id.startsWith('temp-');
                const isActive = activeMessageId === msg.id;

                const canEdit = isFarmer && !msg.image_path && !isPending;
                const canDelete = isFarmer && !isPending;
                const showActions = (canEdit || canDelete) && !isEditing;

                return (
                  <div
                    key={msg.id}
                    className={`message-row ${
                      isFarmer ? 'message-row--sent' : 'message-row--received'
                    } ${isActive ? 'message-row--active' : ''}`}
                    onClick={() => {
                      if (!showActions) return;
                      setActiveMessageId(isActive ? null : msg.id);
                    }}
                  >
                    {showActions && (
                      <div className="message-actions">
                        {canEdit && (
                          <button
                            type="button"
                            className="message-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(msg);
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingMessageId(msg.id);
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
                          onClick={(e) => e.stopPropagation()}
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
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveEdit();
                              }
                              if (e.key === 'Escape') cancelEdit();
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
                              onClick={saveEdit}
                              disabled={!editContent.trim()}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.content && <p>{msg.content}</p>
                      )}

                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending || uploading}
            />

            <button
              type="submit"
              disabled={
                (!newMessage.trim() && !pendingImage) || sending || uploading
              }
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

      {/* ============ Delete this message confirm — WITH MAYA BIRD ICON ============ */}
      {deletingMessageId && (
        <div
          className="talk-delete-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingMessageId(null);
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
                onClick={confirmDeleteMessage}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Delete entire conversation confirm — WITH MAYA BIRD ICON ============ */}
      {showDeleteAllConfirm && (
        <div
          className="talk-delete-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deletingAll) {
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
                onClick={confirmDeleteAll}
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