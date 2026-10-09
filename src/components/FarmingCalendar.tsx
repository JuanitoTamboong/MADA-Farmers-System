import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import AddTaskModal from './AddTaskModal';
import type { TaskPayload, TaskCategory } from './AddTaskModal';
import { supabase } from '../supabase/supabase-client';
import { useFarmerProfile } from '../hooks/useFarmerProfile';
import deleteMayaBird from '../assets/images/maya-bird-delete.png';
import '../css/FarmingCalendar.css';

interface FarmingCalendarProps {
  onNavigate?: (screen: string) => void;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory | null;
  due_at: string;
  completed_at: string | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateTimeInput(d: Date): string {
  const date = toDateInput(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${date}T${hours}:${minutes}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function categoryStyle(category: TaskCategory | null): string {
  switch (category) {
    case 'Irrigation':
      return 'green-bg';
    case 'Pest Monitoring':
      return 'yellow-bg';
    case 'Equipment Maintenance':
      return 'red-bg';
    case 'Fertilizer':
      return 'mint-bg';
    default:
      return 'green-bg';
  }
}

function TaskIcon({ category }: { category: TaskCategory | null }) {
  if (category === 'Pest Monitoring') {
    return (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 8V4M8 6l8 0" />
        <rect x="7" y="8" width="10" height="12" rx="5" fill="#D97706" fillOpacity="0.2" />
        <path d="M5 12h2M17 12h2M5 16h2M17 16h2" />
      </svg>
    );
  }

  if (category === 'Equipment Maintenance') {
    return (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          fill="#DC2626"
          fillOpacity="0.2"
        />
      </svg>
    );
  }

  if (category === 'Fertilizer') {
    return (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22V12" />
        <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" fill="#059669" fillOpacity="0.3" />
        <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" fill="#059669" fillOpacity="0.3" />
      </svg>
    );
  }

  // default = Irrigation
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#1B4D2E">
      <path d="M12 2C11.5 2 11 2.5 11 3V12C9 10 7 10 5 12C3 14 3 17 5.5 19.5C8 22 12 22 12 22C12 22 16 22 18.5 19.5C21 17 21 14 19 12C17 10 15 10 13 12V3C13 2.5 12.5 2 12 2Z" opacity="0.2" />
      <path
        d="M12 3V21M12 21C12 21 7 19 7 14C7 11.5 9.5 9.5 12 12C14.5 9.5 17 11.5 17 14C17 19 12 21 12 21Z"
        stroke="#1B4D2E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="7" r="2.5" fill="#1B4D2E" />
    </svg>
  );
}

function TaskActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="task-actions">
      <button type="button" onClick={onEdit} aria-label="Edit task">
        Edit
      </button>
      <button
        type="button"
        className="task-delete-action"
        onClick={onDelete}
        aria-label="Delete task"
      >
        Delete
      </button>
    </div>
  );
}

function FarmingCalendar({ onNavigate }: FarmingCalendarProps) {
  const { profile, loading: profileLoading, error: profileError } =
    useFarmerProfile();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [weekStart, setWeekStart] = useState(() => {
    const t = startOfDay(new Date());
    t.setDate(t.getDate() - t.getDay());
    return t;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskRow | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const loadTasks = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase
      .from('tasks')
      .select('id, title, description, category, due_at, completed_at')
      .eq('farmer_id', profile.id)
      .order('due_at', { ascending: true });

    if (dbError) {
      setError(dbError.message);
      setTasks([]);
      setLoading(false);
      return;
    }

    setTasks(data as TaskRow[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleSaveTask = async (payload: TaskPayload): Promise<boolean> => {
    if (!profile || savingRef.current) return false;

    const dueIso = new Date(payload.dueAt).toISOString();
    savingRef.current = true;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (editingTask) {
        const { data, error: dbError } = await supabase
          .from('tasks')
          .update({
            title: payload.title,
            description: payload.description ?? null,
            category: payload.category,
            due_at: dueIso,
          })
          .eq('id', editingTask.id)
          .eq('farmer_id', profile.id)
          .select('id')
          .maybeSingle();

        if (dbError) {
          const msg = dbError.message.toLowerCase();
          setError(
            dbError.code === '23505' || msg.includes('duplicate key')
              ? 'You already have that task on that day.'
              : dbError.message
          );
          return false;
        }
        if (!data) {
          setError('This task could not be updated or is no longer available.');
          return false;
        }
      } else {
        const { error: dbError } = await supabase.from('tasks').insert({
          farmer_id: profile.id,
          title: payload.title,
          description: payload.description ?? null,
          category: payload.category,
          due_at: dueIso,
        });

        if (dbError) {
          const msg = dbError.message.toLowerCase();
          setError(
            dbError.code === '23505' || msg.includes('duplicate key')
              ? 'You already have that task on that day.'
              : dbError.message
          );
          return false;
        }
      }

      await loadTasks();
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save this task. Please try again.'
      );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!profile || !deletingTask || savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', deletingTask.id)
        .eq('farmer_id', profile.id)
        .select('id')
        .maybeSingle();

      if (dbError) {
        setError(dbError.message);
        return;
      }
      if (!data) {
        setError('This task could not be deleted or is no longer available.');
        return;
      }

      setDeletingTask(null);
      await loadTasks();
      setSuccessMessage('Task deleted successfully.');
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this task. Please try again.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const toggleComplete = async (task: TaskRow) => {
    const next = task.completed_at ? null : new Date().toISOString();

    const { error: dbError } = await supabase
      .from('tasks')
      .update({ completed_at: next })
      .eq('id', task.id)
      .eq('farmer_id', profile?.id);

    if (dbError) {
      setError(dbError.message);
      setSuccessMessage(null);
      return;
    }
    await loadTasks();
    setSuccessMessage(
      task.completed_at ? 'Task marked as incomplete.' : 'Task completed successfully.'
    );
  };

  const tasksForSelectedDay = tasks.filter((t) =>
    sameDay(new Date(t.due_at), selectedDate)
  );

  const upcoming = tasks
    .filter(
      (t) =>
        !t.completed_at &&
        new Date(t.due_at) > selectedDate &&
        !sameDay(new Date(t.due_at), selectedDate)
    )
    .slice(0, 3);

  const monthLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  // ---- Render gates ----
  if (profileLoading) {
    return (
      <PageLayout
        activeTab="Tasks"
        onNavigate={onNavigate}
        loading
        loadingText="Loading calendar…"
      >
        {null}
      </PageLayout>
    );
  }

  if (profileError || !profile) {
    return (
      <PageLayout activeTab="Tasks" onNavigate={onNavigate}>
        <div className="calendar-screen">
          <PageHeader title="Farming Calendar" align="left" />
          <p className="calendar-error" role="alert">
            {profileError ?? 'Unable to load your profile.'}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="Tasks" onNavigate={onNavigate}>
      <div className="calendar-screen">
        <PageHeader title="Farming Calendar" align="left" />

        {/* MONTH SELECTOR */}
        <div className="month-selector">
          <button
            type="button"
            className="month-nav-btn"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="Previous week"
          >
            ‹
          </button>
          <h2>{monthLabel}</h2>
          <button
            type="button"
            className="month-nav-btn"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Next week"
          >
            ›
          </button>
        </div>

        {/* WEEK VIEW */}
        <div className="week-grid">
          {weekDays.map((d) => {
            const isActive = sameDay(d, selectedDate);
            const isToday = sameDay(d, today);
            return (
              <button
                type="button"
                key={d.toISOString()}
                className={`week-day ${isActive ? 'active' : ''} ${
                  isToday ? 'today' : ''
                }`}
                onClick={() => setSelectedDate(d)}
              >
                <span className="day-name">{WEEKDAYS[d.getDay()]}</span>
                <span className="day-number">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {successMessage && (
          <p className="calendar-success" role="status" aria-live="polite">
            {successMessage}
          </p>
        )}

        {error && !modalOpen && !deletingTask && (
          <p className="calendar-error" role="alert">
            {error}
          </p>
        )}

        {/* TASKS FOR SELECTED DAY */}
        <section className="tasks-section">
          <div className="section-header">
            <h3>
              {sameDay(selectedDate, today)
                ? "Today's Tasks"
                : `Tasks · ${formatDay(selectedDate.toISOString())}`}
            </h3>
            <button
              type="button"
              className="add-task-link"
              onClick={() => {
                setEditingTask(null);
                setError(null);
                setModalOpen(true);
              }}
            >
              + Add Task
            </button>
          </div>

          <div className="task-list-card">
            {loading ? (
              <div className="calendar-task-item">
                <div className="task-info">
                  <h4>Loading tasks…</h4>
                </div>
              </div>
            ) : tasksForSelectedDay.length === 0 ? (
              <div className="calendar-task-item">
                <div className="task-info">
                  <h4>No tasks for this day.</h4>
                  <p>Tap “Add Task” to create one.</p>
                </div>
              </div>
            ) : (
              tasksForSelectedDay.map((task, idx) => (
                <div key={task.id}>
                  {idx > 0 && <div className="task-divider" />}
                  <div className="calendar-task-item">
                    <button
                      type="button"
                      onClick={() => toggleComplete(task)}
                      aria-label={
                        task.completed_at
                          ? `Mark ${task.title} as incomplete`
                          : `Mark ${task.title} as complete`
                      }
                      aria-pressed={Boolean(task.completed_at)}
                      title={
                        task.completed_at
                          ? 'Mark as not done'
                          : 'Mark as done'
                      }
                      className={`task-icon-circle ${categoryStyle(
                        task.category
                      )}${task.completed_at ? ' task-completed-toggle' : ''}`}
                    >
                      {task.completed_at ? '✓' : (
                        <TaskIcon category={task.category} />
                      )}
                    </button>
                    <div className="task-info">
                      <h4
                        style={
                          task.completed_at
                            ? { textDecoration: 'line-through', opacity: 0.6 }
                            : undefined
                        }
                      >
                        {task.title}
                      </h4>
                      {task.completed_at && (
                        <span className="task-completed-badge">
                          <span aria-hidden="true">✓</span> Completed
                        </span>
                      )}
                      {task.description && <p>{task.description}</p>}
                      <span className="task-time">
                        {formatTime(task.due_at)}
                      </span>
                    </div>
                    <TaskActions
                      onEdit={() => {
                        setError(null);
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
                      onDelete={() => {
                        setError(null);
                        setDeletingTask(task);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* UPCOMING */}
        <section className="upcoming-section">
          <h3>Upcoming</h3>
          <div className="upcoming-card">
            {upcoming.length === 0 ? (
              <div className="task-info">
                <h4>Nothing scheduled ahead.</h4>
              </div>
            ) : (
              upcoming.map((t, idx) => (
                <div key={t.id}>
                  {idx > 0 && <div className="task-divider" />}
                  <div className="calendar-task-item">
                    <div
                      className={`task-icon-circle ${categoryStyle(
                        t.category
                      )}`}
                    >
                      <TaskIcon category={t.category} />
                    </div>
                    <div className="task-info">
                      <h4>{t.title}</h4>
                      <p>{formatDay(t.due_at)}</p>
                    </div>
                    <TaskActions
                      onEdit={() => {
                        setError(null);
                        setEditingTask(t);
                        setModalOpen(true);
                      }}
                      onDelete={() => {
                        setError(null);
                        setDeletingTask(t);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {modalOpen && (
          <AddTaskModal
            key={editingTask?.id ?? 'new-task'}
            defaultDate={toDateInput(selectedDate)}
            mode={editingTask ? 'edit' : 'add'}
            initialValues={
              editingTask
                ? {
                    title: editingTask.title,
                    description: editingTask.description ?? undefined,
                    category: editingTask.category ?? 'Irrigation',
                    dueAt: toDateTimeInput(new Date(editingTask.due_at)),
                  }
                : undefined
            }
            saving={saving}
            error={error}
            onClose={() => {
              if (savingRef.current) return;
              setModalOpen(false);
              setEditingTask(null);
            }}
            onSave={handleSaveTask}
          />
        )}
      </div>
      {deletingTask &&
        createPortal(
          <div className="task-delete-overlay">
            <section
              className="task-delete-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="task-delete-title"
              aria-describedby="task-delete-description"
            >
              <img
                src={deleteMayaBird}
                alt="MADA"
                className="task-delete-logo"
              />
              <h2 id="task-delete-title">Delete this task?</h2>
              <p id="task-delete-description">
                <strong>{deletingTask.title}</strong> will be permanently
                deleted. This action can&apos;t be undone.
              </p>
              {error && (
                <p className="task-delete-error" role="alert">
                  {error}
                </p>
              )}
              <div className="task-delete-actions">
                <button
                  type="button"
                  className="task-delete-cancel"
                  onClick={() => {
                    setDeletingTask(null);
                    setError(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="task-delete-confirm"
                  onClick={handleDeleteTask}
                  disabled={saving}
                >
                  {saving ? 'Deleting…' : 'Yes, delete task'}
                </button>
              </div>
            </section>
          </div>,
          document.body
        )}
    </PageLayout>
  );
}

export default FarmingCalendar;