import { useCallback, useEffect, useRef, useState } from 'react';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import { supabase } from '../supabase/supabase-client';
import { useFarmerProfile } from '../hooks/useFarmerProfile';
import '../css/CropHealth.css';

interface CropHealthProps {
  onNavigate?: (screen: string) => void;
}

interface ReportRow {
  id: string;
  note: string | null;
  image_path: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_note: string | null;
  created_at: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: ReportRow['status']): string {
  if (status === 'resolved') return 'Resolved';
  if (status === 'reviewed') return 'Reviewed';
  return 'Pending';
}

function CropHealth({ onNavigate }: CropHealthProps) {
  const { profile, loading: profileLoading, error: profileError } =
    useFarmerProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // ---- load past reports for this farmer ----
  const loadReports = useCallback(async () => {
    if (!profile) return;
    setReportsLoading(true);
    setReportsError(null);

    const { data, error } = await supabase
      .from('pest_reports')
      .select('id, note, image_path, status, admin_note, created_at')
      .eq('farmer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      setReportsError(error.message);
      setReports([]);
      setReportsLoading(false);
      return;
    }

    setReports(data as ReportRow[]);

    // Pre-sign each image URL so <img> can render them from a private bucket.
    if (data && data.length > 0) {
      const paths = data.map((r) => r.image_path);
      const { data: signed } = await supabase.storage
        .from('pest-reports')
        .createSignedUrls(paths, 60 * 60); // 1 hour

      if (signed) {
        const map: Record<string, string> = {};
        signed.forEach((s) => {
          if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
        });
        setSignedUrls(map);
      }
    }

    setReportsLoading(false);
  }, [profile]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // ---- free object URL when selection changes or unmount ----
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !file) return;
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setReportsError(null);

    const ext =
      file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'jpg';
    const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;

    // 1) Upload image
    const { error: uploadError } = await supabase.storage
      .from('pest-reports')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      submittingRef.current = false;
      setSubmitting(false);
      setReportsError(uploadError.message);
      return;
    }

    // 2) Insert report row
    const { error: dbError } = await supabase.from('pest_reports').insert({
      farmer_id: profile.id,
      note: note.trim() || null,
      image_path: path,
      status: 'pending',
    });

    if (dbError) {
      // Roll back the uploaded image
      await supabase.storage.from('pest-reports').remove([path]);
      submittingRef.current = false;
      setSubmitting(false);
      setReportsError(dbError.message);
      return;
    }

    submittingRef.current = false;
    setSubmitting(false);
    clearSelection();
    await loadReports();
  };

  const handleDelete = async (report: ReportRow) => {
    if (!profile) return;
    if (report.status !== 'pending') return;
    const confirmed = window.confirm('Delete this report?');
    if (!confirmed) return;

    // Remove storage object, then DB row
    await supabase.storage.from('pest-reports').remove([report.image_path]);
    await supabase.from('pest_reports').delete().eq('id', report.id);
    await loadReports();
  };

  // ---- render gates ----
  if (profileLoading) {
    return (
      <PageLayout
        activeTab="Home"
        onNavigate={onNavigate}
        hideNav
        loading
        loadingText="Loading…"
      >
        {null}
      </PageLayout>
    );
  }

  if (profileError || !profile) {
    return (
      <PageLayout activeTab="Home" onNavigate={onNavigate} hideNav>
        <div className="crop-health-container">
          <PageHeader
            title="Pest & Disease Report"
            onBack={() => onNavigate?.('Home')}
          />
          <p className="crop-health-error" role="alert">
            {profileError ?? 'Unable to load your profile.'}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="Home" onNavigate={onNavigate} hideNav>
      <div className="crop-health-container">
        <PageHeader
          title="Pest & Disease Report"
          onBack={() => onNavigate?.('Home')}
        />

        {/* IMAGE PREVIEW */}
        <div className="crop-banner-wrapper">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected crop"
              className="crop-banner-img"
            />
          ) : (
            <div className="crop-banner-empty">
              <p>No photo selected yet</p>
              <span>Take a clear close-up of the affected plant part.</span>
            </div>
          )}
        </div>

        {/* PHOTO ACTIONS */}
        <div className="upload-actions">
          <button
            type="button"
            className="take-photo-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {file ? 'Change Photo' : 'Take or Choose Photo'}
          </button>

          {file && (
            <button
              type="button"
              className="upload-gallery-link"
              onClick={clearSelection}
              disabled={submitting}
            >
              Remove photo
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* NOTE + SUBMIT */}
        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="report-note">
              What did you notice? (optional)
            </label>
            <textarea
              id="report-note"
              rows={3}
              placeholder="e.g. Brown spots appeared 3 days ago on lower leaves."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
            />
          </div>

          {reportsError && (
            <p className="crop-health-error" role="alert">
              {reportsError}
            </p>
          )}

          <button
            type="submit"
            className="submit-report-btn"
            disabled={!file || submitting}
          >
            {submitting ? 'Sending…' : 'Send Report to Admin'}
          </button>
        </form>

        {/* PAST REPORTS */}
        <section className="reports-section">
          <h3 className="section-title">My Reports</h3>

          {reportsLoading ? (
            <p className="reports-empty">Loading your reports…</p>
          ) : reports.length === 0 ? (
            <p className="reports-empty">
              You haven&apos;t sent any reports yet.
            </p>
          ) : (
            <ul className="reports-list">
              {reports.map((r) => (
                <li key={r.id} className="report-item">
                  <div className="report-thumb-wrapper">
                    {signedUrls[r.image_path] ? (
                      <img
                        src={signedUrls[r.image_path]}
                        alt="Report"
                        className="report-thumb"
                      />
                    ) : (
                      <div className="report-thumb report-thumb-placeholder" />
                    )}
                  </div>

                  <div className="report-info">
                    <div className="report-top">
                      <span className={`report-status status-${r.status}`}>
                        {statusLabel(r.status)}
                      </span>
                      <span className="report-date">
                        {formatDate(r.created_at)}
                      </span>
                    </div>

                    {r.note && (
                      <p className="report-note">{r.note}</p>
                    )}

                    {r.admin_note && (
                      <p className="report-admin-note">
                        <b>Admin:</b> {r.admin_note}
                      </p>
                    )}
                  </div>

                  {r.status === 'pending' && (
                    <button
                      type="button"
                      className="report-delete-btn"
                      onClick={() => handleDelete(r)}
                      aria-label="Delete report"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

export default CropHealth;