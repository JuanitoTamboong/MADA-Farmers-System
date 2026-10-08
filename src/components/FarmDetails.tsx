import { useEffect, useState } from 'react';
import '../css/FarmDetails.css';
import PageLayout from '../shared/PageLayout';
import { supabase } from '../supabase/supabase-client';
import { useFarmerProfile } from '../hooks/useFarmerProfile';

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
  );
}

export default FarmDetails;