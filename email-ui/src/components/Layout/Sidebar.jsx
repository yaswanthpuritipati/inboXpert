import React from "react";

export function Sidebar({ folder, setFolder, onCompose }) {
  const folders = [
    { id: "inbox", label: "Inbox", icon: "bi-inbox-fill", grad: "var(--gradient-inbox)" },
    { id: "sent", label: "Sent", icon: "bi-send-fill", grad: "var(--gradient-sent)" },
    { id: "not_spam", label: "Not Spam", icon: "bi-shield-fill-check", grad: "var(--gradient-not-spam)" },
    { id: "spam", label: "Spam", icon: "bi-shield-fill-x", grad: "var(--gradient-spam)" },
  ];

  return (
    <aside className="sidebar d-none d-md-flex flex-column border-end fade-in" style={{ width: "260px", minWidth: "260px", backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }}>
      <div className="p-4">
        <button 
          className="compose-btn btn w-100 d-flex align-items-center justify-content-center gap-3 py-3 rounded-4 text-white shadow-md transition-all" 
          onClick={onCompose}
          style={{ letterSpacing: "0.01em" }}
        >
          <i className="bi bi-pencil-square fs-5" />
          <span className="fw-bold fs-6">Compose</span>
        </button>
      </div>
      
      <nav className="flex-grow-1 px-3">
        <ul className="list-unstyled">
          {folders.map((f, index) => (
            <li key={f.id} className="mb-3 stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
              <button
                className={`sidebar-item btn w-100 text-start d-flex align-items-center gap-3 px-3 py-3 border-0 rounded-4 transition-all ${
                  folder === f.id ? "active shadow-sm" : "hover-bg-light"
                }`}
                onClick={() => setFolder(f.id)}
                style={{ backgroundColor: folder === f.id ? "var(--bg-selected)" : "transparent" }}
              >
                <div 
                  className="sidebar-item-pill shadow-sm" 
                  style={{ 
                    background: folder === f.id ? f.grad : "var(--bg-hover)", 
                    color: folder === f.id ? "white" : "var(--text-light)" 
                  }}
                >
                  <i className={`bi ${f.icon} ${folder === f.id ? 'fs-5' : 'fs-5 text-muted'}`} />
                </div>
                <span className={`fw-bold ${folder === f.id ? "text-main" : "text-muted"}`} style={{ fontSize: "0.95rem", letterSpacing: "0.01em" }}>{f.label}</span>
                {folder === f.id && <i className="bi bi-chevron-right ms-auto opacity-50 small" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="glass p-3 rounded-4 text-center small text-muted border">
          <p className="mb-0 fw-medium">All systems normal</p>
          <span className="opacity-75">v1.2.0 • InboXpert</span>
        </div>
      </div>
    </aside>
  );
}

