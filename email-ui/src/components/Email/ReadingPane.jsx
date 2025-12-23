import React, { useState } from "react";
import { api } from "../../services/api";

export function ReadingPane({ mail, onClose, onReply }) {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const doSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.summary(mail.body_text);
      setSummary(res.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Reset summary when mail changes
  React.useEffect(() => {
    setSummary(null);
    setLoadingSummary(false);
  }, [mail?.id]);

  if (!mail) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-5" style={{ backgroundColor: "var(--bg-hover)" }}>
        <div className="icon-box glass p-4 rounded-circle mb-4 shadow-sm border">
          <i className="bi bi-envelope-open-heart fs-1 opacity-50 text-primary" />
        </div>
        <h5 className="fw-bold text-main mb-2">Nothing selected</h5>
        <p className="text-muted small">Select an email to view its full content and AI insights.</p>
      </div>
    );
  }

  return (
    <div className="reading-pane d-flex flex-column h-100 fade-in" style={{ backgroundColor: "var(--bg-panel)" }}>
      {/* Header */}
      <div className="p-4 border-bottom shadow-sm" style={{ borderColor: "var(--border-color)", zIndex: 5 }}>
        <div className="d-flex align-items-start justify-content-between mb-4">
          <h3 className="mb-0 fw-extra-bold flex-grow-1 text-main" style={{ letterSpacing: "-0.01em", lineHeight: "1.2" }}>
            {mail.subject || "(no subject)"}
          </h3>
          <button className="btn btn-light btn-icon rounded-circle shadow-sm border ms-3 transition-all" onClick={onClose} title="Close Reading Pane">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle text-white shadow-md" style={{ width: 48, height: 48, background: "var(--gradient-primary)" }}>
              {mail.from_addr?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="fw-bold fs-6 text-main">{mail.from_addr}</div>
              <div className="small text-muted fw-medium">to me <span className="opacity-50 mx-1">•</span> {mail.to_addr}</div>
            </div>
          </div>
          <div className="text-end">
             <div className="small fw-bold text-muted opacity-50 uppercase tracking-wider mb-1" style={{ fontSize: "0.75rem" }}>
              {new Date(mail.received_at || Date.now()).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="small text-muted opacity-75">
              {new Date(mail.received_at || Date.now()).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-primary rounded-pill d-flex align-items-center gap-2 px-4 shadow-md transition-all"
            onClick={doSummary}
            disabled={loadingSummary || summary}
          >
            {loadingSummary ? <i className="bi bi-arrow-repeat spin" /> : <i className="bi bi-stars" />}
            <span className="fw-bold">{summary ? 'Summarized' : 'AI Summary'}</span>
          </button>
          <button 
            className="btn btn-light rounded-pill d-flex align-items-center gap-2 px-4 border shadow-sm transition-all fw-semibold"
            onClick={() => onReply(mail)}
          >
            <i className="bi bi-reply-fill" />
            <span>Reply</span>
          </button>
          <div className="dropdown ms-auto">
             <button className="btn btn-light btn-icon rounded-circle border shadow-sm transition-all">
                <i className="bi bi-three-dots-vertical" />
             </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-grow-1 overflow-auto p-4 p-lg-5">
        {summary && (
          <div className="mb-5 p-4 rounded-4 fade-in-up shadow-sm border-0 position-relative overflow-hidden" 
               style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", borderLeft: "4px solid var(--color-primary) !important" }}>
            <div className="position-absolute top-0 end-0 p-3 opacity-10">
               <i className="bi bi-stars fs-1" />
            </div>
            <h6 className="fw-bold d-flex align-items-center gap-2 mb-3 text-primary">
              <i className="bi bi-magic" /> Intelligence Summary
            </h6>
            <p className="mb-0 text-main fs-6" style={{ lineHeight: "1.7", letterSpacing: "0.01em" }}>{summary}</p>
          </div>
        )}
        <div 
          className="email-body fs-6" 
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.8", color: "var(--text-muted)", fontWeight: "400" }}
        >
          {mail.body_text}
        </div>
      </div>
    </div>
  );
}

