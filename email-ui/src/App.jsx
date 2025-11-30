// src/App.jsx
// Gmail-style UI (React + Bootstrap) with a FAST draggable splitter (rAF + Pointer Events).
// Requires:
//   npm i bootstrap bootstrap-icons
// In src/main.jsx (or here) import:
//   import 'bootstrap/dist/css/bootstrap.min.css'
//   import 'bootstrap/dist/js/bootstrap.bundle.min.js'
//   import 'bootstrap-icons/font/bootstrap-icons.css'

import React, { useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

const API = import.meta?.env?.VITE_API_URL || "http://localhost:8000";

/* ---------------------------- Toasts (Bootstrap) --------------------------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((x) => [...x, { id, ...t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.duration ?? 3000);
  };
  const Host = () => (
    <div className="toast-host position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
      {toasts.map((t) => (
        <div key={t.id} className={`toast show text-white ${t.variant === "error" ? "bg-danger" : "bg-success"}`}>
          <div className="d-flex align-items-center p-2">
            <i className={`bi ${t.variant === "error" ? "bi-x-circle" : "bi-check-circle"} me-2`} />
            <div className="me-auto fw-semibold">{t.title}</div>
            <button className="btn btn-sm btn-light" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              Close
            </button>
          </div>
          {t.desc && <div className="toast-body pt-0 pb-2 px-3">{t.desc}</div>}
        </div>
      ))}
    </div>
  );
  return { add, Host };
}

/* --------------------------------- API ------------------------------------ */
const api = {
  list: async (folder) => {
    const r = await fetch(`${API}/emails?folder=${encodeURIComponent(folder)}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  mark: async (id, spam) => {
    const r = await fetch(`${API}/emails/mark/${id}?spam=${spam}`, { method: "POST" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  sync: async (email, max = 50) => {
    const r = await fetch(`${API}/emails/sync?user_email=${encodeURIComponent(email)}&max_results=${max}`, {
      method: "POST",
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  draft: async (payload) => {
    const r = await fetch(`${API}/generate/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  send: async (payload) => {
    const r = await fetch(`${API}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};

/* ----------------------------- Compose Modal ------------------------------ */
function ComposeModal({ userEmail, onSent, toast }) {
  const [to, setTo] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("formal");
  const [length, setLength] = useState("medium");
  const [lang, setLang] = useState("en");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const closeBtn = useRef(null);

  const gen = async () => {
    if (!prompt.trim()) return toast({ title: "Enter a prompt", variant: "error" });
    setBusy(true);
    try {
      const d = await api.draft({ prompt, tone, length, target_lang: lang });
      setDraft(d);
      toast({ title: "Draft ready", desc: d.intent, variant: "success" });
    } catch (e) {
      toast({ title: "Generation failed", desc: String(e), variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!draft) return toast({ title: "Generate a draft first", variant: "error" });
    if (!to.trim()) return toast({ title: "Enter recipient", variant: "error" });
    if (!userEmail || !userEmail.trim()) {
      return toast({ 
        title: "Email required", 
        desc: "Please enter your Gmail address in the top bar and sign in first", 
        variant: "error" 
      });
    }
    try {
      const res = await api.send({ user_email: userEmail.trim(), to, subject: draft.subject, body: draft.body });
      toast({ title: "Sent", desc: `Message ID ${res.id}`, variant: "success" });
      onSent?.();
      closeBtn.current?.click();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      toast({ title: "Send failed", desc: errorMsg, variant: "error" });
    }
  };

  return (
    <div className="modal fade" id="composeModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-pencil-square me-2" />Compose</h5>
            <button ref={closeBtn} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body">
            <div className="mb-2">
              <label className="form-label">To</label>
              <input className="form-control" placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="form-label">Prompt</label>
              <textarea className="form-control" rows={3} placeholder="Short prompt or keywords" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>
            <div className="row g-2 mb-3">
              <div className="col">
                <label className="form-label">Tone</label>
                <select className="form-select" value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option>formal</option><option>neutral</option><option>friendly</option><option>persuasive</option><option>concise</option>
                </select>
              </div>
              <div className="col">
                <label className="form-label">Length</label>
                <select className="form-select" value={length} onChange={(e) => setLength(e.target.value)}>
                  <option>short</option><option>medium</option><option>detailed</option>
                </select>
              </div>
              <div className="col">
                <label className="form-label">Language</label>
                <select className="form-select" value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="en">English</option><option value="hi">Hindi</option><option value="te">Telugu</option><option value="ta">Tamil</option>
                </select>
              </div>
            </div>
            {draft && (
              <div className="border rounded p-2">
                <div className="small text-muted mb-1">Subject</div>
                <input className="form-control mb-2" readOnly value={draft.subject} />
                <div className="small text-muted mb-1">Body</div>
                <textarea className="form-control" rows={8} readOnly value={draft.body} />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={gen} disabled={busy}>
              {busy ? <i className="bi bi-arrow-repeat spin me-1" /> : <i className="bi bi-stars me-1" />} Generate
            </button>
            <button className="btn btn-primary" onClick={send} disabled={!draft || busy}>
              <i className="bi bi-send me-1" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Email Row -------------------------------- */
function EmailRow({ e, selected, toggle, onOpen, onStar, onSpam, onNotSpam }) {
  return (
    <div className={`d-flex align-items-center border-bottom py-2 px-2 ${selected ? "bg-light" : ""}`}>
      <input className="form-check-input me-2" type="checkbox" checked={selected} onChange={() => toggle(e.id)} />
      <i
        className={`bi ${e.starred ? "bi-star-fill text-warning" : "bi-star"} me-2`}
        onClick={(ev) => { ev.stopPropagation(); onStar(e.id); }}
        role="button"
      />
      <div className="fw-semibold me-3 text-truncate" style={{ maxWidth: 200 }} onClick={() => onOpen(e)}>
        {e.from_addr || "—"}
      </div>
      <div className="text-truncate me-auto minw-0" onClick={() => onOpen(e)}>
        <span className="fw-semibold">{e.subject || "(no subject)"} </span>
        <span className="text-muted">— {e.body_text?.slice(0, 140)}</span>
      </div>
      <div className="ms-2 text-nowrap small text-muted">{new Date(e.received_at || Date.now()).toLocaleDateString()}</div>
      <div className="ms-2 dropdown">
        <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">Actions</button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li><button className="dropdown-item" onClick={() => onNotSpam(e.id)}><i className="bi bi-inbox me-2" /> Move to Inbox</button></li>
          <li><button className="dropdown-item" onClick={() => onSpam(e.id)}><i className="bi bi-shield-exclamation me-2" /> Mark Spam</button></li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------ Reading Pane ------------------------------ */
function ReadingPane({ mail }) {
  if (!mail) return <div className="text-center text-muted py-5"><i className="bi bi-envelope-open me-2" />Select an email to read</div>;
  return (
    <div className="p-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="mb-0">{mail.subject || "(no subject)"}</h5>
        <div className="small text-muted">{new Date(mail.received_at || Date.now()).toLocaleString()}</div>
      </div>
      <div className="mb-2 text-muted">From: {mail.from_addr} • To: {mail.to_addr}</div>
      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{mail.body_text}</div>
    </div>
  );
}

/* --------------------------------- App ------------------------------------ */
export default function GmailLikeUI() {
  const { add: toast, Host: ToastHost } = useToasts();
  const [folder, setFolder] = useState("all");
  const [emails, setEmails] = useState([]);
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [openMail, setOpenMail] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check URL parameters for auth success and auto-fill email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get("auth");
    const email = params.get("email");
    
    if (authSuccess === "success" && email) {
      setUserEmail(email);
      setIsAuthenticated(true);
      // Store in localStorage
      localStorage.setItem("userEmail", email);
      localStorage.setItem("isAuthenticated", "true");
      toast({ title: "Signed in successfully", desc: `Authenticated as ${email}`, variant: "success" });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check localStorage on mount
      const storedEmail = localStorage.getItem("userEmail");
      const storedAuth = localStorage.getItem("isAuthenticated");
      if (storedEmail && storedAuth === "true") {
        setUserEmail(storedEmail);
        setIsAuthenticated(true);
      }
    }
  }, [toast]);

  // Splitter state: we keep the *saved* width in state, but live-drag via refs (no rerenders).
  const [savedPaneWidthPx, setSavedPaneWidthPx] = useState(420);
  const splitRef = useRef(null);
  const paneRef = useRef(null);
  const pendingWidth = useRef(savedPaneWidthPx);
  const dragging = useRef(false);
  const rafId = useRef(0);

  // rAF writer: applies the latest pendingWidth to the pane element once per frame
  const ensureRAF = () => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      if (paneRef.current) {
        paneRef.current.style.width = `${pendingWidth.current}px`;
      }
      // If still dragging, schedule next frame to keep things ultra-smooth
      if (dragging.current) ensureRAF();
    });
  };

  // Pointer events for super-smooth drag (mouse + touch unified)
  useEffect(() => {
    const onPointerMove = (e) => {
      if (!dragging.current || !splitRef.current) return;
      e.preventDefault();
      const rect = splitRef.current.getBoundingClientRect();
      const x = e.clientX; // pointer events give clientX for both mouse/touch/pen
      // Width of reading pane is distance from pointer to right edge.
      let w = Math.round(rect.right - x);
      // Natural bounds: 0..container width
      if (w < 0) w = 0;
      else if (w > rect.width) w = rect.width;
      pendingWidth.current = w;
      ensureRAF();
    };

    const onPointerUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.classList.remove("resizing");
      setSavedPaneWidthPx(pendingWidth.current); // commit once at the end
      // release capture if any active element has it
      try { splitterEl?.releasePointerCapture?.(lastPointerId.current); } catch {}
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastPointerId = useRef(null);
  let splitterEl = null; // will be set in JSX via callback ref

  const startDrag = (e) => {
    dragging.current = true;
    document.body.classList.add("resizing");
    lastPointerId.current = e.pointerId;
    // capture events to the splitter so movement remains smooth even if pointer leaves element
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const load = async (f = folder) => {
    setLoading(true);
    try {
      const data = await api.list(f);
      setEmails(data.map((x) => ({ ...x, starred: x.starred ?? false })));
    } catch (e) {
      toast({ title: "Failed to load", desc: String(e), variant: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(folder); }, [folder]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return emails;
    return emails.filter(
      (e) =>
        (e.subject || "").toLowerCase().includes(q) ||
        (e.from_addr || "").toLowerCase().includes(q) ||
        (e.body_text || "").toLowerCase().includes(q)
    );
  }, [emails, search]);

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const onStar = (id) => setEmails((arr) => arr.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)));
  const onSpam = async (id) => { await api.mark(id, true); toast({ title: "Marked spam", variant: "success" }); load(); };
  const onNotSpam = async (id) => { await api.mark(id, false); toast({ title: "Moved to inbox", variant: "success" }); load(); };

  const bulkMark = async (spam) => {
    for (const id of selected) { try { await api.mark(id, spam); } catch {} }
    toast({ title: spam ? "Moved to Spam" : "Moved to Inbox", variant: "success" });
    setSelected(new Set());
    load();
  };

  const doSync = async () => {
    if (!userEmail.trim()) return toast({ title: "Enter your Gmail", variant: "error" });
    try {
      const res = await api.sync(userEmail.trim(), 50);
      toast({ title: "Synced", desc: `${res.inserted || 0} new emails` });
      load();
    } catch (e) {
      toast({ title: "Sync failed", desc: String(e), variant: "error" });
    }
  };

  return (
    <div className="mail-app vh-100 d-flex flex-column" style={{ maxWidth: "100vw", overflowX: "hidden" }}>
      <ToastHost />

      {/* Top bar */}
      <nav className="navbar navbar-light bg-light border-bottom px-3">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => load()} title="Refresh">
            <i className="bi bi-arrow-repeat" />
          </button>
          <span className="fw-bold">Mail</span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-fill mx-3">
          <i className="bi bi-search text-muted" />
          <input
            className="form-control form-control-sm flex-fill"
            placeholder="Search mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <input
            className="form-control form-control-sm"
            placeholder="your Gmail"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            disabled={isAuthenticated}
            style={isAuthenticated ? { backgroundColor: "#e9ecef", cursor: "not-allowed" } : {}}
          />
          <button className="btn btn-primary btn-sm" onClick={doSync} disabled={!isAuthenticated && !userEmail.trim()}>
            <i className="bi bi-cloud-arrow-down me-1" /> Sync
          </button>
          {isAuthenticated ? (
            <>
              <button className="btn btn-success btn-sm" disabled>
                <i className="bi bi-check-circle me-1" /> Signed in
              </button>
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={() => {
                  setIsAuthenticated(false);
                  setUserEmail("");
                  localStorage.removeItem("userEmail");
                  localStorage.removeItem("isAuthenticated");
                  toast({ title: "Signed out", variant: "success" });
                }}
              >
                <i className="bi bi-box-arrow-right me-1" /> Sign out
              </button>
            </>
          ) : (
            <a className="btn btn-outline-secondary btn-sm" href={`${API}/auth/google`}>
              <i className="bi bi-box-arrow-in-right me-1" /> Sign in
            </a>
          )}
        </div>
      </nav>

      {/* Main area */}
      <div className="flex-grow-1 d-flex">
        {/* Sidebar */}
        <aside className="sidebar border-end p-3 d-none d-md-block" style={{ background: "#fff", width: "clamp(200px, 22vw, 260px)" }}>
          <button className="btn btn-danger w-100 mb-3" data-bs-toggle="modal" data-bs-target="#composeModal">
            <i className="bi bi-pencil me-1" /> Compose
          </button>
          <ul className="list-unstyled small">
            <li><button className={`btn w-100 text-start ${folder === "all" ? "btn-outline-primary" : "btn-outline-secondary"} mb-2`} onClick={() => setFolder("all")}><i className="bi bi-inbox me-2" /> Inbox</button></li>
            <li><button className={`btn w-100 text-start ${folder === "not_spam" ? "btn-outline-primary" : "btn-outline-secondary"} mb-2`} onClick={() => setFolder("not_spam")}><i className="bi bi-shield-check me-2" /> Not Spam</button></li>
            <li><button className={`btn w-100 text-start ${folder === "spam" ? "btn-outline-primary" : "btn-outline-secondary"} mb-2`} onClick={() => setFolder("spam")}><i className="bi bi-shield-exclamation me-2" /> Spam</button></li>
          </ul>
        </aside>

        {/* Split pane container (for geometry) */}
        <section ref={splitRef} className="flex-grow-1 d-flex minw-0" style={{ height: "calc(100vh - 56px)" }}>
          {/* LEFT: list column */}
          <div className="flex-grow-1 minw-0 d-flex flex-column" style={{ background: "#fff" }}>
            <div className="border-bottom p-2 d-flex align-items-center gap-2">
              <div className="dropdown">
                <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">Select</button>
                <ul className="dropdown-menu">
                  <li><button className="dropdown-item" onClick={() => setSelected(new Set(filtered.map((x) => x.id)))}>All</button></li>
                  <li><button className="dropdown-item" onClick={() => setSelected(new Set())}>None</button></li>
                </ul>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => bulkMark(false)} disabled={!selected.size}><i className="bi bi-inbox me-1" /> Move to Inbox</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => bulkMark(true)} disabled={!selected.size}><i className="bi bi-shield-exclamation me-1" /> Spam</button>
              {loading && <span className="ms-auto small text-muted"><i className="bi bi-arrow-repeat spin me-1" /> Loading…</span>}
            </div>
            <div className="flex-grow-1 overflow-auto">
              {filtered.map((e) => (
                <EmailRow
                  key={e.id}
                  e={e}
                  selected={selected.has(e.id)}
                  toggle={toggle}
                  onOpen={setOpenMail}
                  onStar={onStar}
                  onSpam={onSpam}
                  onNotSpam={onNotSpam}
                />
              ))}
              {filtered.length === 0 && <div className="text-center text-muted py-5">No emails</div>}
            </div>
          </div>

          {/* SPLITTER (fast) */}
          <div
            ref={(el) => (splitterEl = el)}
            className="splitter d-none d-lg-block"
            onPointerDown={startDrag}
            title="Drag to resize"
          >
            <div className="splitter-grip" />
          </div>

          {/* RIGHT: reading pane — width is set via direct style updates during drag */}
          <div
            ref={paneRef}
            className="reading-pane d-none d-lg-flex flex-column"
            style={{ background: "#fff", width: `${savedPaneWidthPx}px` }}
          >
            <div className="flex-grow-1 overflow-auto">
              <ReadingPane mail={openMail} />
            </div>
          </div>
        </section>
      </div>

      {/* Compose Modal */}
      <ComposeModal userEmail={userEmail} onSent={() => {}} toast={toast} />
    </div>
  );
}

/* ----------------------------- Small global CSS ---------------------------- */
const style = document.createElement("style");
style.innerHTML = `
html, body, #root { height: 100%; }
body { overflow-x: hidden; }
.mail-app { max-width: 100vw; overflow-x: hidden; }
.minw-0 { min-width: 0; }
.toast-host { pointer-events: none; }
.toast-host .toast { pointer-events: auto; }
.modal-backdrop.show { opacity: 0 !important; display: none !important; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; display: inline-block; }

/* Splitter: full height, pointer events unified, no lag */
.splitter {
  width: 10px;
  cursor: col-resize;
  background: linear-gradient(180deg, #f1f3f5, #e9ecef);
  border-left: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6;
  z-index: 5;
  touch-action: none; /* prevent touch scrolling while dragging */
  will-change: width;
}
.splitter:hover { background: #e9ecef; }
.splitter-grip {
  position: relative;
  top: 40%;
  margin: 0 auto;
  width: 2px;
  height: 60px;
  background: #adb5bd;
  border-radius: 2px;
}

/* While dragging: prevent text selection and show resize cursor globally */
.resizing, .resizing * { user-select: none !important; cursor: col-resize !important; }

/* Keep scrollbars on panes */
.overflow-auto { overscroll-behavior: contain; }
`;
document.head.appendChild(style);
