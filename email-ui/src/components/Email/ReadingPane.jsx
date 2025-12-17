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
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4" style={{ backgroundColor: "var(--bg-hover)" }}>
        <i className="bi bi-envelope-open fs-1 mb-3 opacity-50" />
        <p className="mb-0">Select an email to read</p>
      </div>
    );
  }

  return (
    <div className="reading-pane d-flex flex-column h-100 fade-in" style={{ backgroundColor: "var(--bg-panel)" }}>
      {/* Header */}
      <div className="p-4 border-bottom" style={{ borderColor: "var(--border-color)" }}>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <h4 className="mb-0 fw-bold flex-grow-1" style={{ color: "var(--text-main)" }}>{mail.subject || "(no subject)"}</h4>
          <button className="btn btn-sm btn-icon btn-light rounded-circle ms-2" onClick={onClose} title="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="d-flex align-items-center gap-2 mb-3">
          <button 
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
            onClick={doSummary}
            disabled={loadingSummary || summary}
          >
            {loadingSummary ? <i className="bi bi-arrow-repeat spin" /> : <i className="bi bi-stars" />}
            <span className="d-none d-md-inline">Summarize</span>
          </button>
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => onReply(mail)}
          >
            <i className="bi bi-reply" />
            <span className="d-none d-md-inline">Reply</span>
          </button>
          <span className="small text-muted ms-auto">
            {new Date(mail.received_at || Date.now()).toLocaleString()}
          </span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle text-white" style={{ width: 40, height: 40, background: "var(--gradient-primary)" }}>
            {mail.from_addr?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="fw-semibold" style={{ color: "var(--text-main)" }}>{mail.from_addr}</div>
            <div className="small" style={{ color: "var(--text-muted)" }}>to {mail.to_addr}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-grow-1 overflow-auto p-4">
        {summary && (
          <div className="mb-4 p-3 rounded-3 fade-in-up" style={{ background: "var(--bg-selected)", border: "1px solid var(--color-primary)" }}>
            <h6 className="fw-bold d-flex align-items-center gap-2 mb-2">
              <i className="bi bi-stars text-primary" /> AI Summary
            </h6>
            <p className="mb-0 small" style={{ lineHeight: "1.6" }}>{summary}</p>
          </div>
        )}
        <div 
          className="email-body" 
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.6", color: "var(--text-main)" }}
        >
          {mail.body_text}
        </div>
      </div>
    </div>
  );
}

