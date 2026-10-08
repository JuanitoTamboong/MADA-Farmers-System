import { useState } from "react";
import PageLayout from "../shared/PageLayout";
import PageHeader from "../shared/PageHeader";
import "../css/FarmFinances.css";

interface FarmFinancesProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export default function FarmFinances({ onBack, onNavigate }: FarmFinancesProps) {
  const [activeTab, setActiveTab] = useState<"Expenses" | "Income">("Expenses");

  const expenseItems = [
    {
      id: 1,
      label: "Seeds",
      amount: "₱ 3,000",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22V12" />
          <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
          <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
        </svg>
      ),
    },
    {
      id: 2,
      label: "Fertilizer",
      amount: "₱ 8,500",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L18 2L20 7L4 7L6 2Z" />
          <path d="M4 7C4 7 3 14 3 17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17C21 14 20 7 20 7" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      ),
    },
    {
      id: 3,
      label: "Pesticides",
      amount: "₱ 2,500",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2h4v4h-4z" />
          <path d="M12 6v3" />
          <path d="M8 9h8l1 11H7L8 9z" />
        </svg>
      ),
    },
    {
      id: 4,
      label: "Labor",
      amount: "₱ 7,000",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 5,
      label: "Fuel / Equipment",
      amount: "₱ 2,000",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" />
          <path d="M15 11a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2" />
          <line x1="3" y1="18" x2="15" y2="18" />
        </svg>
      ),
    },
    {
      id: 6,
      label: "Transportation",
      amount: "₱ 1,500",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      id: 7,
      label: "Other",
      amount: "₱ 1,000",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      ),
    },
  ];

  return (
    <PageLayout activeTab="Farm" onNavigate={onNavigate} hideNav>
      <div className="finances-container">

        <PageHeader
          title="Farm Finances"
          onBack={onBack || (() => onNavigate?.("Home"))}
        />

        {/* SUMMARY CARDS */}
        <section className="finances-summary">
          {/* TOTAL EXPENSES CARD */}
          <div className="summary-card total-expenses-card">
            <div className="summary-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L18 2L20 7L4 7L6 2Z" />
                <path d="M4 7C4 7 3 14 3 17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17C21 14 20 7 20 7" />
                <circle cx="12" cy="14" r="2" />
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Expenses</span>
              <h3 className="summary-amount">₱ 24,500</h3>
            </div>
          </div>

          {/* TWO COLUMN ESTIMATES */}
          <div className="summary-grid">
            <div className="summary-card small-card">
              <div className="small-card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Estimated Revenue</span>
              </div>
              <h4>₱ 65,000</h4>
            </div>

            <div className="summary-card small-card">
              <div className="small-card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Estimated Profit</span>
              </div>
              <h4>₱ 40,500</h4>
            </div>
          </div>
        </section>

        {/* EXPENSES / INCOME SEGMENTED CONTROL */}
        <div className="finances-toggle-pill">
          <button
            className={`toggle-btn ${activeTab === "Expenses" ? "active" : ""}`}
            onClick={() => setActiveTab("Expenses")}
          >
            Expenses
          </button>
          <button
            className={`toggle-btn ${activeTab === "Income" ? "active" : ""}`}
            onClick={() => setActiveTab("Income")}
          >
            Income
          </button>
        </div>

        {/* EXPENSE LIST */}
        <section className="finances-list-card">
          {expenseItems.map((item) => (
            <div className="finance-row" key={item.id}>
              <div className="finance-item-left">
                <span className="row-icon-box">{item.icon}</span>
                <span className="row-label">{item.label}</span>
              </div>
              <span className="row-amount">{item.amount}</span>
            </div>
          ))}
        </section>

        {/* BOTTOM ACTION BUTTON */}
        <div className="add-expense-container">
          <button className="add-expense-btn">Add Expense</button>
        </div>

      </div>
    </PageLayout>
  );
}