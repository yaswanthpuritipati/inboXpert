import React from "react";

export function ToastContainer({ toasts, remove }) {
  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`toast show text-white mb-2 slide-in ${t.variant === "error" ? "bg-danger" : "bg-success"}`}
          role="alert"
          style={{ minWidth: "280px" }}
        >
          <div className="d-flex align-items-center p-3">
            <i className={`bi ${t.variant === "error" ? "bi-x-circle-fill" : "bi-check-circle-fill"} me-2 fs-5`} />
            <div className="me-auto">
              <div className="fw-semibold">{t.title}</div>
              {t.desc && <div className="small opacity-75">{t.desc}</div>}
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white ms-2" 
              onClick={() => remove(t.id)}
              aria-label="Close"
            />
          </div>
          <div className="toast-progress" />
        </div>
      ))}
    </div>
  );
}

