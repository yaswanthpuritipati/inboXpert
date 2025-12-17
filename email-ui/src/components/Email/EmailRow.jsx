import React from "react";

export function EmailRow({ e, selected, toggle, onOpen, onStar, onSpam, onNotSpam, index = 0 }) {
  const [starAnimating, setStarAnimating] = React.useState(false);

  const handleStar = (id) => {
    setStarAnimating(true);
    onStar(id);
    setTimeout(() => setStarAnimating(false), 300);
  };

  return (
    <div 
      className={`email-row stagger-item d-flex align-items-center border-bottom py-3 px-3 cursor-pointer position-relative ${
        selected ? "selected" : ""
      }`}
      onClick={() => onOpen(e)}
      style={{ animationDelay: `${index * 50}ms`, borderColor: "var(--border-color)" }}
    >
      {/* Selection & Star */}
      <div className="d-flex align-items-center gap-3 me-3" onClick={(ev) => ev.stopPropagation()}>
        <input 
          className="form-check-input mt-0 cursor-pointer" 
          type="checkbox" 
          checked={selected} 
          onChange={() => toggle(e.id)} 
        />
        <i
          className={`star-icon bi ${e.starred ? "bi-star-fill text-warning starred" : "bi-star text-secondary"} cursor-pointer ${starAnimating ? 'starred' : ''}`}
          onClick={() => handleStar(e.id)}
          style={{ fontSize: "1.1rem" }}
        />
      </div>

      {/* Content */}
      <div className="flex-grow-1 minw-0 d-flex flex-column flex-md-row align-items-md-center gap-1 gap-md-3">
        {/* Sender */}
        <div className="fw-semibold text-truncate" style={{ width: "200px", color: "var(--text-main)" }}>
          {e.from_addr || "—"}
        </div>
        
        {/* Subject & Preview */}
        <div className="text-truncate flex-grow-1 text-secondary">
          <span className="fw-medium" style={{ color: "var(--text-main)" }}>{e.subject || "(no subject)"}</span>
          <span className="mx-2 opacity-50">—</span>
          <span className="opacity-75">{e.body_text?.slice(0, 100)}</span>
        </div>
      </div>

      {/* Date & Actions */}
      <div className="d-flex align-items-center gap-3 ms-3">
        <span className="small text-muted text-nowrap">
          {new Date(e.received_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        
        {/* Hover Actions */}
        <div className="hover-actions d-none d-md-flex align-items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
          <button 
            className="btn btn-sm btn-icon btn-light rounded-circle" 
            onClick={() => onNotSpam(e.id)} 
            title="Move to Inbox"
          >
            <i className="bi bi-inbox" />
          </button>
          <button 
            className="btn btn-sm btn-icon btn-light rounded-circle" 
            onClick={() => onSpam(e.id)} 
            title="Mark as Spam"
          >
            <i className="bi bi-shield-exclamation" />
          </button>
        </div>
      </div>
    </div>
  );
}

