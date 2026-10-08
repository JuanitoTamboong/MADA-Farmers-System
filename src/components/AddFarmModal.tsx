import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../css/AddFarmModal.css';

export interface FarmFormPayload {
  name: string;
  location: string;
  area: string;             // raw numeric string, e.g. "2.5"
  crop: string;
  variety?: string;
  status?: string;
  plantedDate?: string;     // "YYYY-MM-DD"
  expectedHarvest?: string; // "YYYY-MM-DD"
  image?: string | null;    // base64 data URL or null
}

interface AddFarmModalProps {
  initialValues?: FarmFormPayload;
  mode?: 'add' | 'edit';
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: FarmFormPayload) => void | Promise<void>;   // ← THE FIX
}

function AddFarmModal({
  initialValues,
  mode = 'add',
  saving = false,
  onClose,
  onSave,
}: AddFarmModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(() => ({
    name: initialValues?.name ?? '',
    location: initialValues?.location ?? 'Odiongan, Romblon',
    area: initialValues?.area ?? '',
    crop: initialValues?.crop ?? 'Rice',
    variety: initialValues?.variety ?? '',
    status: initialValues?.status ?? 'Growing',
    plantedDate: initialValues?.plantedDate ?? '',
    expectedHarvest: initialValues?.expectedHarvest ?? '',
  }));

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialValues?.image ?? null
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🚫 Already saving — ignore extra submits.
    if (saving) return;

    onSave({
      name: form.name,
      location: form.location,
      area: form.area,
      crop: form.crop,
      variety: form.variety.trim(),
      status: form.status,
      plantedDate: form.plantedDate || undefined,
      expectedHarvest: form.expectedHarvest || undefined,
      image: imagePreview,
    });
  };

  const modal = (
    <div className="modal-overlay">
      <div className="modal-content page-transition">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Farm' : 'Add New Farm'}</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-farm-form">
          {/* PHOTO UPLOAD */}
          <div className="form-group">
            <label>Farm Photo</label>
            <div className="photo-upload">
              {imagePreview ? (
                <div className="photo-preview-wrap">
                  <img
                    src={imagePreview}
                    alt="Farm preview"
                    className="photo-preview"
                  />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={handleRemoveImage}
                    aria-label="Remove photo"
                    disabled={saving}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="photo-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Upload Photo</span>
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                hidden
              />
            </div>
          </div>

          <div className="form-group">
            <label>Farm Name</label>
            <input
              type="text"
              required
              placeholder="e.g. San Jose Farm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Odiongan, Romblon"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Area (ha)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="2.5"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Crop</label>
              <select
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
                disabled={saving}
              >
                <option value="Rice">Rice</option>
                <option value="Corn">Corn</option>
                <option value="Vegetables">Vegetables</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Variety</label>
            <input
              type="text"
              required
              placeholder="e.g. NSIC Rc 222"
              value={form.variety}
              onChange={(e) => setForm({ ...form, variety: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Farm Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              disabled={saving}
            >
              <option value="Growing">Growing</option>
              <option value="Harvested">Harvested</option>
              <option value="Fallow">Fallow</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Planted Date</label>
              <input
                type="date"
                value={form.plantedDate}
                onChange={(e) =>
                  setForm({ ...form, plantedDate: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Expected Harvest</label>
              <input
                type="date"
                value={form.expectedHarvest}
                onChange={(e) =>
                  setForm({ ...form, expectedHarvest: e.target.value })
                }
                disabled={saving}
              />
            </div>
          </div>

          <button
            type="submit"
            className="save-farm-btn"
            disabled={saving}
          >
            {saving
              ? mode === 'edit'
                ? 'Updating…'
                : 'Saving…'
              : mode === 'edit'
                ? 'Update Farm'
                : 'Save Farm'}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default AddFarmModal;