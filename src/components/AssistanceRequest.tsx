import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import '../css/AssistanceRequest.css';
import deleteMayaBird from '../assets/images/maya-bird-delete.png';
import successMayaBird from '../assets/images/success-maya-bird.png';

import { supabase } from '../supabase/supabase-client';
import {
  createAssistanceRequest,
  deleteAssistanceRequest,
  fetchFarmerProfileLite,
  fetchMyAssistanceRequests,
  updateAssistanceRequest,
} from '../ts/assistance';
import type {
  AssistanceCategory,
  AssistanceRequestRecord,
  AssistanceStatus,
  FarmerProfileLite,
} from '../ts/assistance';

interface AssistanceRequestProps {
  onNavigate?: (screen: string) => void;
}

const categories: AssistanceCategory[] = [
  'Seeds',
  'Fertilizer',
  'Technical Assistance',
  'Pest Inspection',
  'Financial Subsidy',
];

// ---------- per-category icon style ----------
interface CategoryStyle {
  iconBg: string;
  iconColor: string;
  iconSvg: React.ReactNode;
}

function styleForCategory(category: AssistanceCategory): CategoryStyle {
  switch (category) {
    case 'Seeds':
      return {
        iconBg: '#fef3c7',
        iconColor: '#1c3a27',
        iconSvg: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22V12" />
            <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
            <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
          </svg>
        ),
      };
    case 'Fertilizer':
      return {
        iconBg: '#e0f2fe',
        iconColor: '#1c3a27',
        iconSvg: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        ),
      };
    case 'Technical Assistance':
      return {
        iconBg: '#e0e7ff',
        iconColor: '#1c3a27',
        iconSvg: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        ),
      };
    case 'Pest Inspection':
      return {
        iconBg: '#dcfce7',
        iconColor: '#1c3a27',
        iconSvg: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        ),
      };
    case 'Financial Subsidy':
    default:
      return {
        iconBg: '#f3e8ff',
        iconColor: '#1c3a27',
        iconSvg: (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18" />
            <circle cx="12" cy="14" r="1.5" />
          </svg>
        ),
      };
  }
}

function statusBadgeClass(status: AssistanceStatus): string {
  switch (status) {
    case 'Pending':
      return 'badge-pending';
    case 'Approved':
      return 'badge-approved';
    case 'In Progress':
      return 'badge-in-progress';
    case 'Completed':
      return 'badge-completed';
    case 'Rejected':
      return 'badge-rejected';
    default:
      return '';
  }
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface RequestFormFields {
  contact: string;
  reason: string;
  additionalDetails: string;
}

// ---------- auto-generated formal request letter ----------
// Returns null if any required field is missing — caller blocks submit.
function buildFormalRequest(
  farmer: FarmerProfileLite | null,
  category: AssistanceCategory,
  fields: RequestFormFields,
): string | null {
  if (!farmer) return null;

  const name = farmer.fullName?.trim();
  const barangay = farmer.barangay?.trim();
  const contact = fields.contact.trim() || farmer.contact?.trim() || '';
  const reason = fields.reason.trim();

  // Require the reason — no silent fallback
  if (!name || !barangay || !reason) return null;

  const today = formatLongDate(new Date());
  const additionalText = fields.additionalDetails.trim();

  const senderLines = [name, barangay, contact].filter(
    (line): line is string => !!line,
  );
  const senderBlock = senderLines.join('\n');

  const requestLine: Record<AssistanceCategory, string> = {
    Seeds:
      'I would like to formally request certified seeds for the upcoming planting season.',
    Fertilizer:
      'I would like to formally request fertilizer assistance for my farming activities.',
    'Technical Assistance':
      'I would like to formally request technical assistance and guidance from your office regarding my farming practices.',
    'Pest Inspection':
      'I would like to formally request a pest inspection of my farmland to address current or potential pest concerns.',
    'Financial Subsidy':
      'I would like to formally request financial subsidy under the Municipal Agriculture Assistance Program.',
  };

  const parts = [
    senderBlock,
    '',
    'Office of the Municipal Agriculturist',
    'Municipal Agriculture Office',
    'Municipal Hall',
    '',
    today,
    '',
    '',
    'Dear Sir/Madame:',
    '',
    '',
    `I am ${name}, a registered farmer of ${barangay}. I have been engaged in farming in this municipality and I am registered under the Municipal Agriculture Office.`,
    '',
    requestLine[category],
    '',
    reason,
    additionalText,
    '',
    'I would highly appreciate your approval of this request. Kindly contact me at the number provided above so I can coordinate with your office regarding the required documents or schedule.',
    '',
    'Thank you for your continued support to our farming community.',
    '',
    '',
    'Respectfully yours,',
    '',
    '',
    name,
  ];

  return parts
    .filter((line) => line !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

const blankFields: RequestFormFields = {
  contact: '',
  reason: '',
  additionalDetails: '',
};

function AssistanceRequest({ onNavigate }: AssistanceRequestProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requestTitle, setRequestTitle] =
    useState<AssistanceCategory>('Seeds');
  const [fields, setFields] = useState<RequestFormFields>(blankFields);

  const [requests, setRequests] = useState<AssistanceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [farmerProfile, setFarmerProfile] =
    useState<FarmerProfileLite | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [previewLetter, setPreviewLetter] = useState<string | null>(null);

  // -------- detail (view) modal --------
  const [viewingRequest, setViewingRequest] =
    useState<AssistanceRequestRecord | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AssistanceRequestRecord | null>(null);

  // ---- resolve current farmer ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (!alive) return;
        if (userError) throw userError;
        if (!userData.user) {
          setError('Sign in to submit and view assistance requests.');
          setLoading(false);
          setProfileLoading(false);
          return;
        }
        setFarmerId(userData.user.id);
      } catch (err) {
        if (!alive) return;
        setError(
          err instanceof Error ? err.message : 'Failed to verify your account.',
        );
        setLoading(false);
        setProfileLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- load farmer profile ----
  useEffect(() => {
    if (!farmerId) return;
    let alive = true;
    setProfileLoading(true);
    (async () => {
      try {
        const profile = await fetchFarmerProfileLite(farmerId);
        if (!alive) return;
        setFarmerProfile(profile);
        if (profile?.contact) {
          setFields((current) => ({ ...current, contact: profile.contact }));
        }
      } catch {
        if (alive) setFarmerProfile(null);
      } finally {
        if (alive) setProfileLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [farmerId]);

  // ---- load requests ----
  const load = useCallback(async () => {
    if (!farmerId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMyAssistanceRequests(farmerId);
      setRequests(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForm = useCallback(() => {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setFields({ ...blankFields, contact: farmerProfile?.contact ?? '' });
    setRequestTitle('Seeds');
    setPreviewLetter(null);
  }, [saving, farmerProfile?.contact]);

  const returnToForm = useCallback(() => {
    setPreviewLetter(null);
    setShowForm(true);
  }, []);

  // ---- close modal on Escape ----
  useEffect(() => {
    if (
      !showForm &&
      !previewLetter &&
      !viewingRequest &&
      !deleteTarget &&
      !successMessage
    ) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (successMessage) {
        setSuccessMessage(null);
      } else if (deleteTarget && !deletingId) {
        setDeleteTarget(null);
        setError(null);
      } else if (previewLetter) returnToForm();
      else if (viewingRequest) setViewingRequest(null);
      else if (showForm && !saving) closeForm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    showForm,
    previewLetter,
    viewingRequest,
    deleteTarget,
    deletingId,
    successMessage,
    saving,
    closeForm,
    returnToForm,
  ]);

  // ---- lock body scroll while any modal is open ----
  useEffect(() => {
    if (
      !showForm &&
      !previewLetter &&
      !viewingRequest &&
      !deleteTarget &&
      !successMessage
    ) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showForm, previewLetter, viewingRequest, deleteTarget, successMessage]);

  const setField = <K extends keyof RequestFormFields>(
    key: K,
    value: RequestFormFields[K],
  ) => setFields((current) => ({ ...current, [key]: value }));

  const openCreateForm = () => {
    setPreviewLetter(null);
    setViewingRequest(null);
    setEditingId(null);
    setRequestTitle('Seeds');
    setFields({ ...blankFields, contact: farmerProfile?.contact ?? '' });
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (item: AssistanceRequestRecord) => {
    setPreviewLetter(null);
    setViewingRequest(null);
    setEditingId(item.id);
    setRequestTitle(item.category);
    setFields({
      contact: farmerProfile?.contact ?? '',
      reason: '',
      additionalDetails: item.notes ?? '',
    });
    setError(null);
    setShowForm(true);
  };

  const openDetail = (item: AssistanceRequestRecord) => {
    // Clear other modals so only one renders at a time
    setPreviewLetter(null);
    setShowForm(false);
    setViewingRequest(item);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!farmerId) {
      setError('Sign in to submit an assistance request.');
      return;
    }

    // Validate required fields before building the letter
    if (!fields.reason.trim()) {
      setError('Please fill in the reason for your request.');
      return;
    }

    const letter = buildFormalRequest(farmerProfile, requestTitle, fields);
    if (!letter) {
      setError(
        'Your farmer profile is incomplete. Please update your name and barangay in Settings before submitting.',
      );
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const wasEditing = Boolean(editingId);
      if (editingId) {
        const updated = await updateAssistanceRequest(editingId, {
          category: requestTitle,
          notes: letter,
        });
        setRequests((current) =>
          current.map((r) => (r.id === editingId ? updated : r)),
        );
      } else {
        const created = await createAssistanceRequest({
          farmerId,
          category: requestTitle,
          notes: letter,
        });
        setRequests((current) => [created, ...current]);
      }
      setShowForm(false);
      setEditingId(null);
      setFields({ ...blankFields, contact: farmerProfile?.contact ?? '' });
      setRequestTitle('Seeds');
      setSuccessMessage(
        wasEditing
          ? 'Request updated successfully.'
          : 'Request submitted successfully.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!fields.reason.trim()) {
      setError('Please fill in the reason for your request before previewing.');
      return;
    }
    const letter = buildFormalRequest(farmerProfile, requestTitle, fields);
    if (!letter) {
      setError(
        'Your farmer profile is incomplete. Please update your name and barangay in Settings before previewing.',
      );
      return;
    }
    setPreviewLetter(letter);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deletingId || !deleteTarget) return;

    const id = deleteTarget.id;
    setDeletingId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      await deleteAssistanceRequest(id);
      setRequests((current) => current.filter((r) => r.id !== id));
      if (viewingRequest?.id === id) setViewingRequest(null);
      setDeleteTarget(null);
      setSuccessMessage('Request deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const profileReady =
    !!farmerProfile?.fullName?.trim() && !!farmerProfile?.barangay?.trim();

  return (
    <PageLayout
      activeTab="Home"
      onNavigate={onNavigate}
      hideNav
      loading={loading || profileLoading}
      loadingText="Loading your assistance requests..."
    >
      <div className="assistance-container">
        <PageHeader
          title="Request"
          onBack={() => onNavigate?.('Home')}
        />

        <button
          className="send-request-btn"
          onClick={openCreateForm}
          type="button"
          disabled={!farmerId || loading || profileLoading || !profileReady}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Send New Request</span>
        </button>

        {farmerId && !profileLoading && !profileReady && (
          <p className="request-empty request-empty--error">
            Your farmer profile is missing a name or barangay. Update it in
            Settings before sending a request.
          </p>
        )}

        <div className="request-card-box">
          {!loading && error && !deleteTarget && (
            <p className="request-empty request-empty--error">{error}</p>
          )}

          {!loading && !error && requests.length === 0 && (
            <p className="request-empty">
              No requests yet. Tap <strong>Send New Request</strong> to start.
            </p>
          )}

          {!loading &&
            !error &&
            requests.map((item, index) => {
              const style = styleForCategory(item.category);
              const canDelete = item.status === 'Pending';
              const canEdit = item.status === 'Pending';
              return (
                <div
                  key={item.id}
                  className={`request-item ${
                    index < requests.length - 1 ? 'has-divider' : ''
                  }`}
                  onClick={() => openDetail(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetail(item);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${item.category} request`}
                >
                  <div
                    className="request-icon-circle"
                    style={{
                      backgroundColor: style.iconBg,
                      color: style.iconColor,
                    }}
                  >
                    {style.iconSvg}
                  </div>

                  <div className="request-info">
                    <h4 className="request-item-title">{item.category}</h4>
                    <span className="request-item-date">
                      {formatShortDate(item.createdAt)}
                    </span>
                  </div>

                  {canEdit && (
                    <button
                      className="request-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(item);
                      }}
                      aria-label={`Edit ${item.category} request`}
                      type="button"
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="request-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setError(null);
                        setDeleteTarget(item);
                      }}
                      disabled={deletingId === item.id}
                      aria-label={`Delete ${item.category} request`}
                      type="button"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  )}

                  <div
                    className={`status-pill ${statusBadgeClass(item.status)}`}
                  >
                    {item.status}
                  </div>
                </div>
              );
            })}
        </div>

        {successMessage &&
          createPortal(
            <div className="request-success-overlay">
              <section
                className="request-success-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="request-success-title"
              >
                <div className="request-success-content" role="status" aria-live="polite">
                  <img
                    src={successMayaBird}
                    alt="Maya bird celebrating"
                    className="request-success-logo"
                  />
                  <h2 id="request-success-title">{successMessage}</h2>
                  <p>Your assistance request list has been updated.</p>
                </div>
                <button
                  type="button"
                  className="request-success-close"
                  onClick={() => setSuccessMessage(null)}
                >
                  Done
                </button>
              </section>
            </div>,
            document.body,
          )}

        {deleteTarget &&
          createPortal(
            <div
              className="request-delete-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !deletingId) {
                  setDeleteTarget(null);
                  setError(null);
                }
              }}
            >
              <section
                className="request-delete-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="request-delete-title"
                aria-describedby="request-delete-description"
              >
                <img
                  src={deleteMayaBird}
                  alt="MADA"
                  className="request-delete-logo"
                />
                <h2 id="request-delete-title">Delete this request?</h2>
                <p id="request-delete-description">
                  Your <strong>{deleteTarget.category}</strong> request will be
                  permanently deleted. This action can&apos;t be undone.
                </p>
                {error && (
                  <p className="request-delete-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="request-delete-actions">
                  <button
                    type="button"
                    className="request-delete-cancel"
                    onClick={() => {
                      setDeleteTarget(null);
                      setError(null);
                    }}
                    disabled={!!deletingId}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="request-delete-confirm"
                    onClick={handleDelete}
                    disabled={!!deletingId}
                  >
                    {deletingId ? 'Deleting…' : 'Yes, delete request'}
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )}

        {/* ---------- CREATE / EDIT MODAL (only when no other modal is open) ---------- */}
        {showForm && !previewLetter && !viewingRequest && (
          <div
            className="request-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeForm();
            }}
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? 'Edit request' : 'New request'}
          >
            <section className="request-modal request-modal--wide">
              <header className="request-modal-header">
                <h2>{editingId ? 'Edit Request' : 'New Request Details'}</h2>
                <button
                  className="request-modal-close"
                  onClick={closeForm}
                  type="button"
                  aria-label="Close"
                  disabled={saving}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </header>

              <form className="new-request-form" onSubmit={handleSave}>
                <div className="form-group">
                  <label>Request Category</label>
                  <select
                    value={requestTitle}
                    onChange={(e) =>
                      setRequestTitle(e.target.value as AssistanceCategory)
                    }
                    disabled={saving}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Contact number</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={fields.contact}
                    onChange={(e) => setField('contact', e.target.value)}
                    placeholder="e.g. 09171234567"
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>Reason for request</label>
                  <textarea
                    rows={3}
                    value={fields.reason}
                    onChange={(e) => setField('reason', e.target.value)}
                    placeholder="e.g. My previous harvest was damaged by heavy rains"
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>Additional details (optional)</label>
                  <textarea
                    rows={3}
                    value={fields.additionalDetails}
                    onChange={(e) =>
                      setField('additionalDetails', e.target.value)
                    }
                    placeholder="Anything else the office should know"
                    disabled={saving}
                  />
                  <p className="form-hint">
                    All fields above will be compiled into your formal request
                    letter.
                  </p>
                </div>

                {error && (
                  <p className="request-form-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handlePreview}
                    disabled={saving}
                  >
                    Preview letter
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving…'
                      : editingId
                        ? 'Save changes'
                        : 'Submit'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ---------- PREVIEW MODAL ---------- */}
        {previewLetter && !showForm && !viewingRequest && (
          <div
            className="request-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) returnToForm();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Letter preview"
          >
            <section className="request-modal request-modal--wide">
              <header className="request-modal-header">
                <h2>Request letter preview</h2>
                <button
                  className="request-modal-close"
                  onClick={returnToForm}
                  type="button"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </header>

              <pre className="request-letter-preview">{previewLetter}</pre>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={returnToForm}
                >
                  Back to form
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ---------- DETAIL (VIEW) MODAL ---------- */}
        {viewingRequest && !showForm && !previewLetter && (
          <div
            className="request-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setViewingRequest(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Request details"
          >
            <section className="request-modal request-modal--wide">
              <header className="request-modal-header">
                <div>
                  <p className="request-detail-eyebrow">REQUEST</p>
                  <h2>{viewingRequest.category}</h2>
                </div>
                <button
                  className="request-modal-close"
                  onClick={() => setViewingRequest(null)}
                  type="button"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </header>

              <div className="request-detail-meta">
                <span className={`status-pill ${statusBadgeClass(viewingRequest.status)}`}>
                  {viewingRequest.status}
                </span>
                <span className="request-detail-date">
                  Submitted {formatShortDate(viewingRequest.createdAt)}
                </span>
              </div>

              <div className="request-detail-block">
                <h3>Formal request letter</h3>
                <pre className="request-letter-preview">
                  {viewingRequest.notes?.trim() || 'No letter content.'}
                </pre>
              </div>

              {viewingRequest.adminNote && (
                <div className="request-detail-block">
                  <h3>Admin note</h3>
                  <p>{viewingRequest.adminNote}</p>
                </div>
              )}

              <div className="form-actions">
                {viewingRequest.status === 'Pending' && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => openEditForm(viewingRequest)}
                  >
                    Edit request
                  </button>
                )}
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => setViewingRequest(null)}
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default AssistanceRequest;