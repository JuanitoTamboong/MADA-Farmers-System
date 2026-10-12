import React, { useCallback, useEffect, useState } from 'react';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import '../css/AssistanceRequest.css';

import { supabase } from '../supabase/supabase-client';
import {
  createAssistanceRequest,
  deleteAssistanceRequest,
  fetchFarmerProfileLite,
  fetchMyAssistanceRequests,
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

// ---------- auto-generated formal request letter ----------
// Returns null when the farmer profile is incomplete,
// so the caller can block submission instead of storing placeholders.
function buildFormalRequest(
  farmer: FarmerProfileLite | null,
  category: AssistanceCategory,
  reason: string,
): string | null {
  if (!farmer) return null;

  const name = farmer.fullName?.trim();
  const barangay = farmer.barangay?.trim();
  const contact = farmer.contact?.trim() || 'N/A';

  if (!name || !barangay) return null;

  const today = formatLongDate(new Date());
  const reasonText = reason.trim() || 'No additional reason provided.';

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

  return `${name}
${barangay}
${contact}

Office of the Municipal Agriculturist
Municipal Agriculture Office
Municipal Hall

${today}


Dear Sir/Madame:


I am ${name}, a registered farmer of ${barangay}. I have been engaged in farming in this municipality and I am registered under the Municipal Agriculture Office.

${requestLine[category]}

${reasonText}

I would highly appreciate your approval of this request. Kindly contact me at the number provided above so I can coordinate with your office regarding the required documents or schedule.

Thank you for your continued support to our farming community.


Respectfully yours,


${name}`;
}

function AssistanceRequest({ onNavigate }: AssistanceRequestProps) {
  const [showForm, setShowForm] = useState(false);
  const [requestTitle, setRequestTitle] =
    useState<AssistanceCategory>('Seeds');
  const [reason, setReason] = useState('');

  const [requests, setRequests] = useState<AssistanceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [farmerProfile, setFarmerProfile] =
    useState<FarmerProfileLite | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  // ---- load farmer profile (for the letter) ----
  useEffect(() => {
    if (!farmerId) return;
    let alive = true;
    setProfileLoading(true);
    (async () => {
      try {
        const profile = await fetchFarmerProfileLite(farmerId);
        if (alive) setFarmerProfile(profile);
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

  // ---- close modal on Escape ----
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setShowForm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, saving]);

  // ---- lock body scroll while modal is open ----
  useEffect(() => {
    if (!showForm) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showForm]);

  const handleAddNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!farmerId) {
      setError('Sign in to submit an assistance request.');
      return;
    }

    const letter = buildFormalRequest(farmerProfile, requestTitle, reason);
    if (!letter) {
      setError(
        'Your farmer profile is incomplete. Please update your name and barangay in Settings before submitting a request.',
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createAssistanceRequest({
        farmerId,
        category: requestTitle,
        notes: letter,
      });
      setRequests((current) => [created, ...current]);
      setShowForm(false);
      setReason('');
      setRequestTitle('Seeds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!window.confirm('Delete this request? This cannot be undone.')) return;

    setDeletingId(id);
    setError(null);
    try {
      await deleteAssistanceRequest(id);
      setRequests((current) => current.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setReason('');
    setRequestTitle('Seeds');
  };

  // Only allow submit if the profile has the required fields
  const profileReady =
    !!farmerProfile?.fullName?.trim() && !!farmerProfile?.barangay?.trim();

  return (
    <PageLayout activeTab="Home" onNavigate={onNavigate} hideNav>
      <div className="assistance-container">
        <PageHeader
          title="Request"
          onBack={() => onNavigate?.('Home')}
        />

        <button
          className="send-request-btn"
          onClick={() => setShowForm(true)}
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
          {loading && (
            <p className="request-empty">Loading your requests…</p>
          )}

          {!loading && error && (
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
              return (
                <div
                  key={item.id}
                  className={`request-item ${
                    index < requests.length - 1 ? 'has-divider' : ''
                  }`}
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

                  {canDelete && (
                    <button
                      className="request-delete-btn"
                      onClick={() => handleDelete(item.id)}
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

        {showForm && (
          <div
            className="request-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeForm();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="New request"
          >
            <section className="request-modal">
              <header className="request-modal-header">
                <h2>New Request Details</h2>
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

              <form
                className="new-request-form"
                onSubmit={handleAddNewRequest}
              >
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
                  <label>Reason / Requirements</label>
                  <textarea
                    rows={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly explain why you need this assistance (e.g. crop affected by heavy rains, new planting season, etc.)"
                    disabled={saving}
                  />
                  <p className="form-hint">
                    This will be included in your formal request letter to the
                    Municipal Agriculture Office.
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
                    {saving ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default AssistanceRequest;