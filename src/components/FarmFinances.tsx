import { useEffect, useRef, useState } from 'react';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import AddExpenseModal from './AddExpensesModal';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpensePayload } from './expenseTypes';
import { supabase } from '../supabase/supabase-client';
import { useFarmerProfile } from '../hooks/useFarmerProfile';
import '../css/FarmFinances.css';

interface FarmFinancesProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

interface ExpenseRow {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  spent_at: string;
}

interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
}

async function fetchExpenses(farmerId: string): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from('farm_expenses')
    .select('id, category, amount, note, spent_at')
    .eq('farmer_id', farmerId)
    .order('spent_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as ExpenseRow[];
}

function formatPeso(n: number): string {
  return `₱ ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function categoryIcon(category: ExpenseCategory) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#1B4D2E',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (category) {
    case 'Seeds':
      return (
        <svg {...common}>
          <path d="M12 22V12" />
          <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
          <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
        </svg>
      );
    case 'Fertilizer':
      return (
        <svg {...common}>
          <path d="M6 2L18 2L20 7L4 7L6 2Z" />
          <path d="M4 7C4 7 3 14 3 17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17C21 14 20 7 20 7" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      );
    case 'Pesticides':
      return (
        <svg {...common}>
          <path d="M10 2h4v4h-4z" />
          <path d="M12 6v3" />
          <path d="M8 9h8l1 11H7L8 9z" />
        </svg>
      );
    case 'Labor':
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'Fuel / Equipment':
      return (
        <svg {...common}>
          <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" />
          <path d="M15 11a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2" />
          <line x1="3" y1="18" x2="15" y2="18" />
        </svg>
      );
    case 'Transportation':
      return (
        <svg {...common}>
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
  }
}

function FarmFinances({ onBack, onNavigate }: FarmFinancesProps) {
  const { profile, loading: profileLoading, error: profileError } =
    useFarmerProfile();

  const [activeTab, setActiveTab] = useState<'Expenses' | 'Income'>('Expenses');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const loadExpenses = async () => {
      try {
        const rows = await fetchExpenses(profile.id);
        if (cancelled) return;
        setExpenses(rows);
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        setExpenses([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load farm expenses.'
        );
      } finally {
        if (!cancelled) {
          setLoadedProfileId(profile.id);
          setLoading(false);
        }
      }
    };

    void loadExpenses();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const handleSaveExpense = async (payload: ExpensePayload) => {
    if (!profile) return;
    if (savingRef.current) return;

    const parsedAmount = Number.parseFloat(payload.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);

    let expenseInserted = false;
    try {
      const { error: dbError } = await supabase
        .from('farm_expenses')
        .insert({
          farmer_id: profile.id,
          category: payload.category,
          amount: parsedAmount,
          note: payload.note?.trim() || null,
          spent_at: payload.spentAt || new Date().toISOString().slice(0, 10),
        });

      if (dbError) throw new Error(dbError.message);

      expenseInserted = true;
      setLoading(true);
      setModalOpen(false);
      setExpenses(await fetchExpenses(profile.id));
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? expenseInserted
            ? `Expense saved, but the list could not be refreshed: ${saveError.message}`
            : saveError.message
          : expenseInserted
            ? 'Expense saved, but the list could not be refreshed.'
            : 'Unable to save the expense. Please try again.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  const categoryTotals: CategoryTotal[] = EXPENSE_CATEGORIES
    .map((category) => ({
      category,
      total: expenses
        .filter((e) => e.category === category)
        .reduce((sum, e) => sum + Number(e.amount), 0),
    }))
    .filter((row) => row.total > 0);

  if (
    profileLoading ||
    (Boolean(profile) && (loading || loadedProfileId !== profile?.id))
  ) {
    return (
      <PageLayout
        activeTab="Farm"
        onNavigate={onNavigate}
        hideNav
        loading
        loadingText="Loading farm finances..."
      >
        {null}
      </PageLayout>
    );
  }

  if (profileError || !profile) {
    return (
      <PageLayout activeTab="Farm" onNavigate={onNavigate} hideNav>
        <div className="finances-container">
          <PageHeader
            title="Farm Finances"
            onBack={onBack || (() => onNavigate?.('Home'))}
          />
          <p className="finances-error" role="alert">
            {profileError ?? 'Unable to load your profile.'}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="Farm" onNavigate={onNavigate} hideNav>
      <div className="finances-container">
        <PageHeader
          title="Farm Finances"
          onBack={onBack || (() => onNavigate?.('Home'))}
        />

        {/* SUMMARY */}
        <section className="finances-summary">
          <div className="summary-card total-expenses-card">
            <div className="summary-icon-box">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B4D2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L18 2L20 7L4 7L6 2Z" />
                <path d="M4 7C4 7 3 14 3 17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17C21 14 20 7 20 7" />
                <circle cx="12" cy="14" r="2" />
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Expenses</span>
              <h3 className="summary-amount">
                {formatPeso(totalExpenses)}
              </h3>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card small-card">
              <div className="small-card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1B4D2E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Estimated Revenue</span>
              </div>
              <h4>Not tracked</h4>
            </div>

            <div className="summary-card small-card">
              <div className="small-card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1B4D2E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Estimated Profit</span>
              </div>
              <h4>Not available</h4>
            </div>
          </div>
        </section>

        {/* TOGGLE */}
        <div className="finances-toggle-pill">
          <button
            className={`toggle-btn ${
              activeTab === 'Expenses' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('Expenses')}
          >
            Expenses
          </button>
          <button
            className={`toggle-btn ${activeTab === 'Income' ? 'active' : ''}`}
            onClick={() => setActiveTab('Income')}
          >
            Income
          </button>
        </div>

        {error && (
          <p className="finances-error" role="alert">
            {error}
          </p>
        )}

        {/* LIST */}
        <section className="finances-list-card">
          {activeTab === 'Expenses' ? (
            categoryTotals.length === 0 ? (
              <div className="finance-row">
                <span className="row-label">
                  No expenses yet. Tap <b>Add Expense</b> to record one.
                </span>
              </div>
            ) : (
              categoryTotals.map((row) => (
                <div className="finance-row" key={row.category}>
                  <div className="finance-item-left">
                    <span className="row-icon-box">
                      {categoryIcon(row.category)}
                    </span>
                    <span className="row-label">{row.category}</span>
                  </div>
                  <span className="row-amount">
                    {formatPeso(row.total)}
                  </span>
                </div>
              ))
            )
          ) : (
            <div className="finance-row">
              <span className="row-label">
                Income tracking is unavailable because no income records are
                configured yet.
              </span>
            </div>
          )}
        </section>

        {/* ACTION */}
        {activeTab === 'Expenses' && (
          <div className="add-expense-container">
            <button
              className="add-expense-btn"
              onClick={() => setModalOpen(true)}
              disabled={saving}
            >
              Add Expense
            </button>
          </div>
        )}

        {modalOpen && (
          <AddExpenseModal
            saving={saving}
            onClose={() => {
              if (savingRef.current) return;
              setModalOpen(false);
            }}
            onSave={handleSaveExpense}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default FarmFinances;