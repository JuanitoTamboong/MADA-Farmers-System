import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../css/AddFarmModal.css';
import successMayaBird from '../assets/images/success-maya-bird.png';

export const TASK_CATEGORIES = [
  'Irrigation',
  'Pest Monitoring',
  'Fertilizer',
  'Equipment Maintenance',
  'Other',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface TaskPayload {
  title: string;
  description?: string;
  category: TaskCategory;
  dueAt: string;       // ISO datetime string, e.g. "2025-10-08T08:00"
}

interface AddTaskModalProps {
  defaultDate?: string;   // YYYY-MM-DD
  saving?: boolean;       // parent-controlled; true while insert is in flight
  error?: string | null;
  onClose: () => void;
  onSave: (payload: TaskPayload) => Promise<boolean>;
}

function AddTaskModal({
  defaultDate,
  saving = false,
  error,
  onClose,
  onSave,
}: AddTaskModalProps) {
  const initial = defaultDate
    ? `${defaultDate}T08:00`
    : new Date().toISOString().slice(0, 16);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Irrigation' as TaskCategory,
    dueAt: initial,
  });

  // 'idle'     = user is filling the form
  // 'success'  = insert finished successfully; show banner and auto-close
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  // Guard against React 18 StrictMode double-invoke on the auto-close timer.
  const closeTimerRef = useRef<number | null>(null);

  // Auto-close after showing the success state.
  useEffect(() => {
    if (status !== 'success') return;

    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 1100);

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [status, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || status === 'success') return;

    const saved = await onSave({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      dueAt: form.dueAt,
    });
    if (saved) setStatus('success');
  };

  const showSuccess = status === 'success';

  const modal = (
    <div className={`modal-overlay${showSuccess ? ' task-success-overlay' : ''}`}>
      <div
        className={`modal-content page-transition${
          showSuccess ? ' task-success-dialog' : ''
        }`}
      >
        <div className="modal-header">
          <h2>{showSuccess ? 'Task Added' : 'Add Task'}</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={saving && !showSuccess}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {showSuccess ? (
          <div className="task-success-content" role="status" aria-live="polite">
            <img
              src={successMayaBird}
              alt="Maya bird celebrating"
              className="task-success-logo"
            />
            <h2>Task added successfully!</h2>
            <p>
              It will appear on your calendar right away.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="add-farm-form">
            {error && (
              <p className="calendar-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-group">
              <label>Task</label>
              <input
                type="text"
                required
                placeholder="e.g. Irrigate north plot"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as TaskCategory })
                }
                disabled={saving}
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>When</label>
              <input
                type="datetime-local"
                required
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. Check water level at pump"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <button
              type="submit"
              className="save-farm-btn"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Task'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default AddTaskModal;