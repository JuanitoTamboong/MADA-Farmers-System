import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../css/FarmDetails.css';
import PageLayout from '../shared/PageLayout';
import { supabase } from '../supabase/supabase-client';
import { useFarmerProfile } from '../hooks/useFarmerProfile';
import AddFarmModal, { type FarmFormPayload } from './AddFarmModal';

interface FarmDetailsProps {
  farmId?: string;
  onBack: () => void;
  onNavigate?: (tab: string) => void;
}

interface FarmRow {
  id: string;
  name: string;
  location: string | null;
  area_hectares: number;
  crop: string | null;
  variety: string | null;
  status: string;
  planted_date: string | null;
  expected_harvest: string | null;
  image_url: string | null;
}

function formatArea(hectares: number | null | undefined): string {
  if (hectares == null) return '—';
  const n = Number(hectares);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2)} ha`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function FarmDetails({ farmId, onBack, onNavigate }: FarmDetailsProps) {
  const { profile, loading: profileLoading, error: profileError } =
    useFarmerProfile();
  const [farmResult, setFarmResult] = useState<{
    farmId: string;
    farm: FarmRow | null;
    error: string | null;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !farmId) return;

    let cancelled = false;

    const loadFarm = async () => {
      const { data, error: dbError } = await supabase
        .from('farms')
        .select(
          'id, name, location, area_hectares, crop, variety, status, planted_date, expected_harvest, image_url'
        )
        .eq('id', farmId)
        .eq('farmer_id', profile.id)
        .maybeSingle();

      if (cancelled) return;

      if (dbError) {
        setFarmResult({ farmId, farm: null, error: dbError.message });
        return;
      }

      if (!data) {
        setFarmResult({ farmId, farm: null, error: 'Farm not found.' });
        return;
      }

      setFarmResult({ farmId, farm: data as FarmRow, error: null });
    };

    void loadFarm();

    return () => {
      cancelled = true;
    };
  }, [farmId, profile]);

  const farm = farmResult?.farmId === farmId ? farmResult?.farm ?? null : null;
  const error =
    profileError ??
    (profileLoading
      ? null
      : !profile
        ? 'Unable to load your profile.'
        : !farmId
          ? 'No farm selected.'
          : farmResult?.farmId === farmId
            ? farmResult.error
            : null);
  const loading =
    profileLoading ||
    (Boolean(profile && farmId) && farmResult?.farmId !== farmId);

  const handleUpdateFarm = async (payload: FarmFormPayload) => {
    if (!farm || !profile || isSaving || isDeleting) return;

    const areaHectares = Number.parseFloat(payload.area);
    const variety = payload.variety?.trim();
    if (!Number.isFinite(areaHectares) || areaHectares <= 0) {
      setActionError('Please enter a valid area in hectares.');
      return;
    }
    if (!variety) {
      setActionError('Please enter the crop variety.');
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('farms')
        .update({
          name: payload.name.trim(),
          location: payload.location.trim() || null,
          area_hectares: areaHectares,
          crop: payload.crop.trim() || null,
          variety,
          status: payload.status ?? farm.status,
          planted_date: payload.plantedDate || null,
          expected_harvest: payload.expectedHarvest || null,
          image_url: payload.image || null,
        })
        .eq('id', farm.id)
        .eq('farmer_id', profile.id)
        .select(
          'id, name, location, area_hectares, crop, variety, status, planted_date, expected_harvest, image_url'
        )
        .maybeSingle();

      if (updateError) {
        if (updateError.code === '23505') {
          setActionError('You already have a farm with that name.');
        } else {
          setActionError(updateError.message);
        }
        return;
      }

      if (!data) {
        setActionError('This farm could not be updated or is no longer available.');
        return;
      }

      setFarmResult({ farmId: farm.id, farm: data as FarmRow, error: null });
      setIsEditing(false);
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this farm. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFarm = async () => {
    if (!farm || !profile || isSaving || isDeleting) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      const { data, error: deleteError } = await supabase
        .from('farms')
        .delete()
        .eq('id', farm.id)
        .eq('farmer_id', profile.id)
        .select('id')
        .maybeSingle();

      if (deleteError) {
        setActionError(deleteError.message);
        return;
      }

      if (!data) {
        setActionError('This farm could not be deleted or is no longer available.');
        return;
      }

      onBack();
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this farm. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout
        activeTab="Farm"
        onNavigate={onNavigate}
        loading
        loadingText="Loading farm details..."
      >
        {null}
      </PageLayout>
    );
  }

  if (error || !farm) {
    return (
      <PageLayout activeTab="Farm" onNavigate={onNavigate}>
        <div className="details-content">
          <div className="details-banner-container">
            <div className="banner-image-placeholder" aria-hidden="true" />
            <div className="banner-top-bar">
              <button
                className="icon-btn back-btn"
                onClick={onBack}
                aria-label="Go Back"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h1 className="banner-title">Farm Details</h1>
              <span />
            </div>
          </div>
          <div className="details-body">
            <p className="details-error" role="alert">
              {error ?? 'Unable to load this farm.'}
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
      <>
      <PageLayout activeTab="Farm" onNavigate={onNavigate}>
      <div className="details-content">
        {/* BANNER */}
        <div className="details-banner-container">
          {farm.image_url ? (
            <img src={farm.image_url} alt={farm.name} className="banner-image" />
          ) : (
            <div className="banner-image-placeholder" aria-hidden="true" />
          )}
          <div className="banner-top-bar">
            <button
              className="icon-btn back-btn"
              onClick={onBack}
              aria-label="Go Back"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="banner-title">Farm Details</h1>
            <span />
          </div>
        </div>

        <div className="details-body">
          {/* NAME + LOCATION */}
          <div className="farm-header-row">
            <div>
              <h2 className="farm-name">{farm.name}</h2>
              {farm.location && (
                <p className="farm-location">
                  <svg
                    className="pin-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {farm.location}
                </p>
              )}
            </div>
          </div>

          <div className="farm-action-buttons">
            <button
              type="button"
              className="edit-btn"
              onClick={() => {
                setActionError(null);
                setIsEditing(true);
              }}
              disabled={isSaving || isDeleting}
            >
              Edit Farm
            </button>
            <button
              type="button"
              className="delete-farm-btn"
              onClick={() => {
                setActionError(null);
                setIsDeleteConfirmOpen(true);
              }}
              disabled={isSaving || isDeleting}
            >
              Delete Farm
            </button>
          </div>

          {actionError && (
            <p className="details-error" role="alert">
              {actionError}
            </p>
          )}

          {/* STATS */}
          <div className="stats-row">
            <div className="stat-col">
              <span className="stat-value">
                {formatArea(farm.area_hectares)}
              </span>
              <span className="stat-label">Area</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-col">
              <span className="stat-value">{farm.crop || '—'}</span>
              <span className="stat-label">Crop</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-col">
              <span className="stat-value">{farm.variety || '—'}</span>
              <span className="stat-label">Variety</span>
            </div>
          </div>

          {/* PLANTING & HARVEST */}
          <div className="section-container">
            <h3 className="section-title">Planting & Harvest</h3>
            <div className="date-cards-grid">
              <div className="date-card">
                <div className="date-icon-box">🌱</div>
                <div>
                  <span className="date-label">Planting Date</span>
                  <p className="date-val">
                    {formatDate(farm.planted_date)}
                  </p>
                </div>
              </div>
              <div className="date-card">
                <div className="date-icon-box">🌾</div>
                <div>
                  <span className="date-label">Expected Harvest</span>
                  <p className="date-val">
                    {formatDate(farm.expected_harvest)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FARM STATUS */}
          <div className="section-container">
            <h3 className="section-title">Farm Status</h3>
            <div className="farm-status-card">
              <span className="farm-status-label">Current status</span>
              <span className="farm-status-value">{farm.status}</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
    {isEditing && (
      <AddFarmModal
        mode="edit"
        saving={isSaving}
        onClose={() => setIsEditing(false)}
        onSave={handleUpdateFarm}
        initialValues={{
          name: farm.name,
          location: farm.location ?? '',
          area: String(farm.area_hectares),
          crop: farm.crop ?? '',
          variety: farm.variety ?? '',
          status: farm.status,
          plantedDate: farm.planted_date ?? '',
          expectedHarvest: farm.expected_harvest ?? '',
          image: farm.image_url,
        }}
      />
    )}
    {isDeleteConfirmOpen &&
      createPortal(
        <div
          className="delete-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setIsDeleteConfirmOpen(false);
            }
          }}
        >
          <section
            className="delete-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-description"
          >
            <div className="delete-confirm-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4m0 4h.01M10.3 3.9 1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 id="delete-confirm-title">Delete this farm?</h2>
            <p id="delete-confirm-description">
              <strong>{farm.name}</strong> and its farm record will be
              permanently deleted. This action can&apos;t be undone.
            </p>
            {actionError && (
              <p className="delete-confirm-error" role="alert">
                {actionError}
              </p>
            )}
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleDeleteFarm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete farm'}
              </button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}

export default FarmDetails;