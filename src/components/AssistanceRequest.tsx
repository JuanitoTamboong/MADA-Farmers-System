import React, { useState } from "react";
import PageLayout from "../shared/PageLayout";
import PageHeader from "../shared/PageHeader";
import "../css/AssistanceRequest.css";

interface AssistanceRequestProps {
  onNavigate?: (screen: string) => void;
}

type RequestStatus = "Pending" | "Approved" | "In Progress" | "Completed";

interface AssistanceItem {
  id: string;
  title: string;
  date: string;
  status: RequestStatus;
  iconBg: string;
  iconColor: string;
  iconSvg: React.ReactNode;
}

function AssistanceRequest({ onNavigate }: AssistanceRequestProps) {
  const [showForm, setShowForm] = useState(false);
  const [requestTitle, setRequestTitle] = useState("Seeds");
  const [notes, setNotes] = useState("");

  const [requests, setRequests] = useState<AssistanceItem[]>([
    {
      id: "1",
      title: "Seeds",
      date: "Oct 2, 2025",
      status: "Pending",
      iconBg: "#fef3c7",
      iconColor: "#1c3a27",
      iconSvg: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22V12" />
          <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
          <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
        </svg>
      ),
    },
    {
      id: "2",
      title: "Fertilizer",
      date: "Sep 28, 2025",
      status: "Approved",
      iconBg: "#e0f2fe",
      iconColor: "#1c3a27",
      iconSvg: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      id: "3",
      title: "Technical Assistance",
      date: "Sep 20, 2025",
      status: "In Progress",
      iconBg: "#e0e7ff",
      iconColor: "#1c3a27",
      iconSvg: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      id: "4",
      title: "Pest Inspection",
      date: "Sep 15, 2025",
      status: "Completed",
      iconBg: "#dcfce7",
      iconColor: "#1c3a27",
      iconSvg: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
  ]);

  const handleAddNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: AssistanceItem = {
      id: Date.now().toString(),
      title: requestTitle,
      date: "Today",
      status: "Pending",
      iconBg: "#fef3c7",
      iconColor: "#1c3a27",
      iconSvg: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22V12" />
          <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
        </svg>
      ),
    };
    setRequests([newReq, ...requests]);
    setShowForm(false);
    setNotes("");
  };

  const getStatusBadgeClass = (status: RequestStatus) => {
    switch (status) {
      case "Pending":
        return "badge-pending";
      case "Approved":
        return "badge-approved";
      case "In Progress":
        return "badge-in-progress";
      case "Completed":
        return "badge-completed";
      default:
        return "";
    }
  };

  return (
    <PageLayout activeTab="Home" onNavigate={onNavigate} hideNav>
      <div className="assistance-container">
        
        <PageHeader
          title="Assistance Request"
          onBack={() => onNavigate?.("Home")}
        />

        {/* Big Main Action Button */}
        <button
          className="send-request-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Send New Request</span>
        </button>

        {/* Collapsible Form for New Request */}
        {showForm && (
          <form className="new-request-form" onSubmit={handleAddNewRequest}>
            <h3>New Request Details</h3>
            <div className="form-group">
              <label>Assistance Category</label>
              <select
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
              >
                <option value="Seeds">Seeds</option>
                <option value="Fertilizer">Fertilizer</option>
                <option value="Technical Assistance">Technical Assistance</option>
                <option value="Pest Inspection">Pest Inspection</option>
                <option value="Financial Subsidy">Financial Subsidy</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes / Requirements</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write specific requests..."
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Submit
              </button>
            </div>
          </form>
        )}

        {/* Request List Card Box */}
        <div className="request-card-box">
          {requests.map((item, index) => (
            <div
              key={item.id}
              className={`request-item ${index < requests.length - 1 ? "has-divider" : ""}`}
            >
              <div
                className="request-icon-circle"
                style={{ backgroundColor: item.iconBg, color: item.iconColor }}
              >
                {item.iconSvg}
              </div>

              <div className="request-info">
                <h4 className="request-item-title">{item.title}</h4>
                <span className="request-item-date">{item.date}</span>
              </div>

              <div className={`status-pill ${getStatusBadgeClass(item.status)}`}>
                {item.status}
              </div>
            </div>
          ))}
        </div>

      </div>
    </PageLayout>
  );
}

export default AssistanceRequest;