import React from "react";

export function Sidebar({ folder, setFolder, onCompose }) {
  const folders = [
    { id: "inbox", label: "Inbox", icon: "bi-inbox" },
    { id: "sent", label: "Sent", icon: "bi-send" },
    { id: "not_spam", label: "Not Spam", icon: "bi-shield-check" },
    { id: "spam", label: "Spam", icon: "bi-shield-exclamation" },
  ];

  return (
    <aside className="sidebar d-none d-md-flex flex-column border-end fade-in" style={{ width: "260px", minWidth: "260px", backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }}>
      <div className="p-3">
        <button 
          className="compose-btn btn w-100 d-flex align-items-center justify-content-center gap-2 py-2 text-white" 
          onClick={onCompose}
        >
          <i className="bi bi-pencil-square" />
          <span className="fw-semibold">Compose</span>
        </button>
      </div>
      
      <nav className="flex-grow-1 px-2">
        <ul className="list-unstyled">
          {folders.map((f, index) => (
            <li key={f.id} className="mb-1 stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
              <button
                className={`sidebar-item btn w-100 text-start d-flex align-items-center gap-3 px-3 py-2 border-0 rounded-3 ${
                  folder === f.id ? "active text-primary fw-semibold" : "text-secondary"
                }`}
                onClick={() => setFolder(f.id)}
              >
                <i className={`bi ${f.icon} fs-5`} />
                <span>{f.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

