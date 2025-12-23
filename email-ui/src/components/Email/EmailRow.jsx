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
      className={`email-row stagger-item d-flex align-items-center border-bottom py-3 px-4 cursor-pointer position-relative transition-all ${
        selected ? "selected" : ""
      }`}
      onClick={() => onOpen(e)}
      style={{ 
        animationDelay: `${index * 40}ms`, 
        borderColor: "var(--border-color)",
        minHeight: "72px"
      }}
    >
      {/* Selection & Star */}
      <div className="d-flex align-items-center gap-3 me-4" onClick={(ev) => ev.stopPropagation()}>
        <div className="custom-checkbox position-relative">
          <input 
            className="form-check-input mt-0 cursor-pointer shadow-sm" 
            type="checkbox" 
            checked={selected} 
            onChange={() => toggle(e.id)} 
            style={{ width: "18px", height: "18px" }}
          />
        </div>
        <i
          className={`star-icon bi ${e.starred ? "bi-star-fill text-warning starred shadow-sm" : "bi-star text-muted opacity-50"} cursor-pointer ${starAnimating ? 'starred' : ''}`}
          onClick={() => handleStar(e.id)}
          style={{ fontSize: "1.2rem" }}
        />
      </div>

      {/* Content */}
      <div className="flex-grow-1 minw-0 d-flex flex-column flex-md-row align-items-md-center gap-1 gap-md-4">
        {/* Sender */}
        <div className={`text-truncate ${!e.read ? 'fw-bold text-main' : 'fw-medium text-muted'}`} style={{ width: "180px", fontSize: "0.95rem" }}>
          {e.from_addr || "—"}
        </div>
        
        {/* Subject & Preview */}
        <div className="text-truncate flex-grow-1">
          <span className={`fs-6 ${!e.read ? 'fw-bold text-main' : 'fw-semibold text-muted opacity-85'}`}>{e.subject || "(no subject)"}</span>
          <span className="mx-2 text-muted opacity-25">—</span>
          <span className="text-muted small opacity-75">{e.body_text?.slice(0, 120)}</span>
        </div>
      </div>

      {/* Date & Actions */}
      <div className="d-flex align-items-center gap-4 ms-3">
        <span className="small fw-bold text-muted text-nowrap opacity-50" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {new Date(e.received_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        
        {/* Hover Actions */}
        <div className="hover-actions d-none d-md-flex align-items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
          <button 
            className="btn btn-sm btn-icon btn-light rounded-circle shadow-sm border" 
            onClick={() => onNotSpam(e.id)} 
            title="Move to Inbox"
          >
            <i className="bi bi-inbox-fill text-primary" />
          </button>
          <button 
            className="btn btn-sm btn-icon btn-light rounded-circle shadow-sm border" 
            onClick={() => onSpam(e.id)} 
            title="Mark as Spam"
          >
            <i className="bi bi-shield-lock-fill text-danger" />
          </button>
          <button 
            className="btn btn-sm btn-icon btn-light rounded-circle shadow-sm border" 
            onClick={() => onOpen(e)} 
            title="Quick View"
          >
            <i className="bi bi-eye-fill text-success" />
          </button>
        </div>
      </div>
    </div>
  );
}

