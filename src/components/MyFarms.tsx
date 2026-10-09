import { useCallback, useEffect, useRef, useState } from 'react';
import '../css/MyFarms.css';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import AddFarmModal, { type FarmFormPayload } from './AddFarmModal';
import farmThumbnail from '../assets/images/farm.jfif';
import { supabase } from '../supabase/supabase-client';
import { useFarmerProfile } from '../hooks/useFarmerProfile';

interface FarmItem {
  id: string;
  name: string;
  location: string;
  areaHectares: number;
  crop: string;
  status: string;
  plantedDate: string | null;
  expectedHarvest: string | null;
  imageUrl: string;
}

interface FarmRow {
  id: string;
  name: string;
  location: string | null;
  area_hectares: number;
  crop: string | null;
  status: string;
  planted_date: string | null;
  expected_harvest: string | null;
  image_url: string | null;
}

interface MyFarmsProps {
  onAddFarm?: () => void;
  onSelectFarm?: (id: string) => void;
  onNavigate?: (tab: string) => void;
}

function formatArea(hectares: number): string {
  return `${hectares.toFixed(2)} hectare${hectares === 1 ? '' : 's'}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function rowToItem(row: FarmRow): FarmItem {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? '',
    areaHectares: Number(row.area_hectares ?? 0),
    crop: row.crop ?? '',
    status: row.status ?? 'Growing',
    plantedDate: row.planted_date,
    expectedHarvest: row.expected_harvest,
    imageUrl: row.image_url ?? farmThumbnail,
  };
}

function MyFarms({ onAddFarm, onSelectFarm, onNavigate }: MyFarmsProps) {
  const { profile, loading: profileLoading, error: profileError } =
    useFarmerProfile();

  const [farms, setFarms] = useState<FarmItem[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmsError, setFarmsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ref guard: same value across double-clicks in the same tick,
  // even if React state hasn't flushed yet.
  const savingRef = useRef(false);

  // One UUID per modal session. Duplicate inserts hit the PK and fail cleanly.
  const submissionIdRef = useRef<string>(crypto.randomUUID());

  const loadFarms = useCallback(async (showLoading = true) => {
    if (!profile) return;
    if (showLoading) setFarmsLoading(true);
    setFarmsError(null);

    const { data, error } = await supabase
      .from('farms')
      .select(
        'id, name, location, area_hectares, crop, status, planted_date, expected_harvest, image_url'
      )
      .eq('farmer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      setFarmsError(error.message);
      setFarms([]);
      if (showLoading) setFarmsLoading(false);
      return;
    }

    setFarms((data as FarmRow[]).map(rowToItem));
    if (showLoading) setFarmsLoading(false);
  }, [profile]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const openModal = () => {
    // Fresh UUID for a fresh form.
    submissionIdRef.current = crypto.randomUUID();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    // Don't allow closing while an insert is in flight.
    if (savingRef.current) return;
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    if (onAddFarm) {
      onAddFarm();
      return;
    }
    openModal();
  };

  const handleSaveFarm = async (payload: FarmFormPayload): Promise<boolean> => {
    if (!profile) return false;

    // 🚫 Hard stop: ignore any click that arrives after the first.
    // Uses the ref so it's synchronous — state updates are async.
    if (savingRef.current) return false;

    const parsedArea = Number.parseFloat(payload.area);
    if (!Number.isFinite(parsedArea) || parsedArea <= 0) {
      setFarmsError('Please enter a valid area in hectares.');
      return false;
    }

    const variety = payload.variety?.trim();
    if (!variety) {
      setFarmsError('Please enter the crop variety.');
      return false;
    }

    savingRef.current = true;
    setSaving(true);
    setFarmsError(null);

    try {
      const { data, error } = await supabase
        .from('farms')
        .insert({
          id: submissionIdRef.current,
          farmer_id: profile.id,
          name: payload.name.trim(),
          location: payload.location?.trim() || null,
          area_hectares: parsedArea,
          crop: payload.crop?.trim() || null,
          variety,
          status: payload.status ?? 'Growing',
          planted_date: payload.plantedDate || null,
          expected_harvest: payload.expectedHarvest || null,
          image_url: payload.image || null,
        })
        .select('id, variety')
        .single();

      if (error) {
        const msg = error.message.toLowerCase();
        if (error.code === '23505' || msg.includes('duplicate key')) {
          setFarmsError('You already have a farm with that name.');
        } else {
          setFarmsError(error.message);
        }
        return false;
      }

      await loadFarms(false);

      if (data.variety?.trim() !== variety) {
        setFarmsError(
          'Farm saved, but the variety was not saved by the database. Check that the farms.variety column exists and is writable.'
        );
      }
      return true;
    } catch (saveError) {
      setFarmsError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the farm. Please try again.'
      );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // ---- Render gates ----
  if (profileLoading) {
    return (
      <PageLayout
        activeTab="Farm"
        onNavigate={onNavigate}
        loading
        loadingText="Loading your farms..."
      >
        {null}
      </PageLayout>
    );
  }

  if (profileError || !profile) {
    return (
      <PageLayout activeTab="Farm" onNavigate={onNavigate}>
        <div className="farms-content">
          <p className="farms-error" role="alert">
            {profileError ?? 'Unable to load your profile.'}
          </p>
        </div>
      </PageLayout>
    );
  }

  if (farmsLoading) {
    return (
      <PageLayout
        activeTab="Farm"
        onNavigate={onNavigate}
        loading
        loadingText="Loading your farms..."
      >
        {null}
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="Farm" onNavigate={onNavigate}>
      <div className="farms-content">
        {/* HEADER */}
        <PageHeader
          title="My Farms"
          align="left"
          action={
            <button
              className="add-farm-btn"
              onClick={handleAddClick}
              disabled={saving}
            >
              <span className="plus-icon">+</span> Add Farm
            </button>
          }
        />

        {farmsError && !isModalOpen && (
          <p className="farms-error" role="alert">
            {farmsError}
          </p>
        )}

        {/* FARMS LIST */}
        <div className="farms-list">
          {farms.length === 0 ? (
            <p className="farms-empty">
              You haven&apos;t added any farms yet. Tap <b>Add Farm</b> to
              create your first one.
            </p>
          ) : (
            farms.map((farm) => (
              <article
                key={farm.id}
                className="farm-card"
                onClick={() => onSelectFarm && onSelectFarm(farm.id)}
              >
                <div className="farm-top-row">
                  <img
                    src={farm.imageUrl}
                    alt={farm.name}
                    className="farm-img"
                  />

                  <div className="farm-details">
                    <div className="farm-name-row">
                      <h2 className="farm-title">{farm.name}</h2>
                      <div className="chevron-btn" aria-label="View Details">
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="currentColor"
                        >
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                      </div>
                    </div>

                    {farm.location && (
                      <p className="farm-meta">
                        <svg
                          className="meta-icon"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {farm.location}
                      </p>
                    )}

                    <p className="farm-meta">
                      <svg
                        className="meta-icon"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
                      </svg>
                      {formatArea(farm.areaHectares)}
                    </p>

                    <div className="badge-row">
                      {farm.crop && (
                        <span className="badge badge-crop">
                          <span className="badge-icon">🌾</span> {farm.crop}
                        </span>
                      )}
                      <span className="badge badge-status">
                        <span className="status-dot"></span> {farm.status}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="farm-divider" />

                <div className="farm-schedule">
                  <p>
                    Planted: <span>{formatDate(farm.plantedDate)}</span>
                  </p>
                  <p>
                    Expected Harvest:{' '}
                    <span>{formatDate(farm.expectedHarvest)}</span>
                  </p>
                </div>
              </article>
            ))
          )}
        </div>

        {isModalOpen && (
          <AddFarmModal
            saving={saving}
            error={farmsError}
            onClose={closeModal}
            onSave={handleSaveFarm}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default MyFarms;