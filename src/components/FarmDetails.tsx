import { useCallback, useEffect, useState } from 'react';
import '../css/FarmDetails.css';
import PageLayout from '../shared/PageLayout';
import farmThumbnail from '../assets/images/farm.jfif';
import { supabase } from '../supabase/supabase-client';

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

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayDiff(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - startOfToday()) / 86_400_000);
}

type ActivityState = 'completed' | 'in-progress' | 'pending';

interface ActivityItem {
  key: string;
  title: string;
  state: ActivityState;
}

function buildActivities(farm: FarmRow): ActivityItem[] {
  const plantedDiff = dayDiff(farm.planted_date);
  const harvestDiff = dayDiff(farm.expected_harvest);
  const harvested = farm.status === 'Harvested';

  const landPrep: ActivityState =
    plantedDiff === null ? 'pending' : 'completed';

  const planting: ActivityState =
    plantedDiff === null
      ? 'pending'
      : plantedDiff <= 0
        ? 'completed'
        : 'in-progress';

  const fertilizer: ActivityState = harvested
    ? 'completed'
    : plantedDiff !== null &&
        plantedDiff <= 0 &&
        (harvestDiff === null || harvestDiff > 0)
      ? 'in-progress'
      : 'pending';

  return [
    { key: 'land-prep', title: 'Land Preparation', state: landPrep },
    { key: 'planting', title: 'Planting', state: planting },
    { key: 'fertilizer', title: 'Fertilizer Application', state: fertilizer },
  ];
}

function ActivityCard({ item }: { item: ActivityItem }) {
  if (item.state === 'completed') {
    return (
      <div className="activity-card completed">
        <div className="status-icon green-check">✓</div>
        <div className="activity-info">
          <h4>{item.title}</h4>
          <p className="status-text text-green">Completed</p>
        </div>
      </div>
    );
  }

  if (item.state === 'in-progress') {
    return (
      <div className="activity-card in-progress">
        <div className="status-icon orange-sprout">🌱</div>
        <div className="activity-info">
          <h4>{item.title}</h4>
          <p className="status-text text-orange">In Progress</p>
        </div>
        <div className="activity-arrow">→</div>
      </div>
    );
  }

  return (
    <div className="activity-card pending">
      <div className="status-icon">•</div>
      <div className="activity-info">
        <h4>{item.title}</h4>
        <p className="status-text">Pending</p>
      </div>
    </div>
  );
}

function FarmDetails({ farmId, onBack, onNavigate }: FarmDetailsProps) {
  const [farm, setFarm] = useState<FarmRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFarm = useCallback(async () => {
    if (!farmId) {
      setLoading(false);
      setError('No farm selected.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase
      .from('farms')
      .select(
        'id, name, location, area_hectares, crop, variety, status, planted_date, expected_harvest, image_url'
      )
      .eq('id', farmId)
      .maybeSingle();

    if (dbError) {
      setError(dbError.message);
      setFarm(null);
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Farm not found.');
      setFarm(null);
      setLoading(false);
      return;
    }

    setFarm(data as FarmRow);
    setLoading(false);
  }, [farmId]);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

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
            <img
              src={farmThumbnail}
              alt="Farm"
              className="banner-image"
            />
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

  const activities = buildActivities(farm);

  return (
    <PageLayout activeTab="Farm" onNavigate={onNavigate}>
      <div className="details-content">
        {/* BANNER */}
        <div className="details-banner-container">
          <img
            src={farm.image_url || farmThumbnail}
            alt={farm.name}
            className="banner-image"
          />
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
            <button className="icon-btn option-btn" aria-label="Options">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
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
            <button className="edit-btn">Edit</button>
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

          {/* ACTIVITIES — derived from real dates */}
          <div className="section-container">
            <h3 className="section-title">Farming Activities</h3>
            <div className="activities-list">
              {activities.map((a) => (
                <ActivityCard key={a.key} item={a} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default FarmDetails;