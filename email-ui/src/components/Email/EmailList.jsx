import React from "react";
import { EmailRow } from "./EmailRow";
import { SkeletonLoader } from "../Shared/SkeletonLoader";

export function EmailList({ 
  emails, 
  selected, 
  toggle, 
  setSelected, 
  onOpen, 
  onStar, 
  onSpam, 
  onNotSpam, 
  loading,
  bulkMark 
}) {
  const allSelected = emails.length > 0 && emails.every(e => selected.has(e.id));

  return (
    <div className="d-flex flex-column h-100" style={{ backgroundColor: "var(--bg-panel)" }}>
      {/* Toolbar */}
      <div className="d-flex align-items-center gap-3 px-3 py-2 border-bottom sticky-top z-10" style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }}>
        <div className="form-check m-0">
          <input 
            className="form-check-input" 
            type="checkbox" 
            checked={allSelected}
            onChange={() => {
              if (allSelected) setSelected(new Set());
              else setSelected(new Set(emails.map(e => e.id)));
            }}
          />
        </div>
        
        <div className="vr h-50 my-auto" />
        
        <div className="d-flex align-items-center gap-1">
          <button 
            className="btn btn-sm btn-light" 
            onClick={() => bulkMark(false)} 
            disabled={!selected.size}
            title="Move to Inbox"
          >
            <i className="bi bi-inbox me-1" />
            <span className="d-none d-sm-inline">Inbox</span>
          </button>
          <button 
            className="btn btn-sm btn-light" 
            onClick={() => bulkMark(true)} 
            disabled={!selected.size}
            title="Mark as Spam"
          >
            <i className="bi bi-shield-exclamation me-1" />
            <span className="d-none d-sm-inline">Spam</span>
          </button>
        </div>

        {selected.size > 0 && !loading && (
          <span className="small text-muted ms-auto">{selected.size} selected</span>
        )}

        {loading && (
          <div className="ms-auto d-flex align-items-center gap-2 text-primary small">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-grow-1 overflow-auto">
        {loading ? (
          <SkeletonLoader count={8} />
        ) : emails.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
            <div className="d-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 80, height: 80, background: "var(--bg-hover)" }}>
              <i className="bi bi-inbox fs-1 opacity-50" />
            </div>
            <p className="mb-0 fw-medium">No emails found</p>
            <p className="small opacity-75 mt-1">Your inbox is empty</p>
          </div>
        ) : (
          emails.map((e, index) => (
            <EmailRow
              key={e.id}
              e={e}
              index={index}
              selected={selected.has(e.id)}
              toggle={toggle}
              onOpen={onOpen}
              onStar={onStar}
              onSpam={onSpam}
              onNotSpam={onNotSpam}
            />
          ))
        )}
      </div>
    </div>
  );
}
