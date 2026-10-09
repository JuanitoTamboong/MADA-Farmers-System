import { useState } from 'react';
import { createPortal } from 'react-dom';
import '../css/AddFarmModal.css';
import {
  DEFAULT_EXPENSE_CATEGORY,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpensePayload,
} from '../ts/expenseTypes';

interface AddExpenseModalProps {
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: ExpensePayload) => void | Promise<void>;
}

function AddExpenseModal({
  saving = false,
  onClose,
  onSave,
}: AddExpenseModalProps) {
  const [form, setForm] = useState({
    category: DEFAULT_EXPENSE_CATEGORY,
    amount: '',
    note: '',
    spentAt: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    onSave({
      category: form.category,
      amount: form.amount,
      note: form.note.trim() || undefined,
      spentAt: form.spentAt || undefined,
    });
  };

  const modal = (
    <div className="modal-overlay">
      <div className="modal-content page-transition">
        <div className="modal-header">
          <h2>Add Expense</h2>
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
          <div className="form-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ExpenseCategory,
                })
              }
              disabled={saving}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount (₱)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              required
              value={form.spentAt}
              onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. 2 sacks from Romblon Agri"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={saving}
            />
          </div>

          <button
            type="submit"
            className="save-farm-btn"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default AddExpenseModal;