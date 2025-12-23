import React, { useEffect, useMemo, useState } from "react";
import * as bootstrap from "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

import { api } from "./services/api";
import { useToasts } from "./hooks/useToasts";
import { ToastContainer } from "./components/Shared/Toast";
import { ResizeDivider } from "./components/Shared/ResizeDivider";
import { Sidebar } from "./components/Layout/Sidebar";
import { TopBar } from "./components/Layout/TopBar";
import { EmailList } from "./components/Email/EmailList";
import { ReadingPane } from "./components/Email/ReadingPane";
import { ComposeModal } from "./components/Compose/ComposeModal";

export default function App() {
  const { add: toast, remove: removeToast, toasts } = useToasts();
  const [folder, setFolder] = useState("inbox");
  const [emails, setEmails] = useState([]);
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [openMail, setOpenMail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [composeData, setComposeData] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [listWidth, setListWidth] = useState(parseInt(localStorage.getItem("listWidth")) || 400);
  const [view, setView] = useState("mail"); // 'mail', 'settings', 'preferences'

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Check URL parameters for auth success and auto-fill email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get("auth");
    const email = params.get("email");
    
    if (authSuccess === "success" && email) {
      setUserEmail(email);
      setIsAuthenticated(true);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("isAuthenticated", "true");
      toast({ title: "Signed in successfully", desc: `Authenticated as ${email}`, variant: "success" });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedEmail = localStorage.getItem("userEmail");
      const storedAuth = localStorage.getItem("isAuthenticated");
      if (storedEmail && storedAuth === "true") {
        setUserEmail(storedEmail);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const load = async (f = folder) => {
    if (!userEmail) {
      setEmails([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.list(f, userEmail);
      setEmails(data.map((x) => ({ ...x, starred: x.starred ?? false })));
    } catch (e) {
      toast({ title: "Failed to load", desc: String(e), variant: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(folder); }, [folder, userEmail]); // Reload when folder or userEmail changes

  // View switchers
  const openMailView = (f) => { setFolder(f); setView("mail"); setOpenMail(null); };

  // ...



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
    <div className="d-flex flex-column h-100" style={{ backgroundColor: "var(--bg-app)" }}>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <TopBar 
        search={search} 
        setSearch={setSearch} 
        userEmail={userEmail} 
        setUserEmail={setUserEmail} 
        isAuthenticated={isAuthenticated} 
        onSignIn={() => {}} // Handled by link in TopBar
        onSignOut={() => {
          setIsAuthenticated(false);
          setUserEmail("");
          setEmails([]);
          localStorage.removeItem("userEmail");
          localStorage.removeItem("isAuthenticated");
          toast({ title: "Signed out", variant: "success" });
        }}
        onSync={doSync}
        onRefresh={() => load()}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setView("settings")}
        onOpenPreferences={() => setView("preferences")}
      />

      <div className="flex-grow-1 d-flex overflow-hidden">
        <Sidebar 
          folder={folder} 
          setFolder={openMailView} 
          onCompose={() => {
            setComposeData(null);
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('composeModal'));
            modal.show();
          }}
        />

        <main className="flex-grow-1 d-flex minw-0 m-3 rounded-4 shadow-sm overflow-hidden border" style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }}>
          {/* Conditionally render views */}
          {view === "mail" ? (
            <>
              {/* Email List - key triggers animation on folder change */}
              <div 
                key={folder}
                className={`${openMail ? 'd-none d-lg-flex' : 'd-flex'} flex-column minw-0 border-end view-enter`} 
                style={{ 
                  width: openMail ? `${listWidth}px` : "100%",
                  minWidth: openMail ? "280px" : undefined,
                  flexShrink: 0,
                  backgroundColor: "var(--bg-panel)"
                }}
              >
                <EmailList 
                  emails={filtered} 
                  selected={selected} 
                  toggle={toggle} 
                  setSelected={setSelected} 
                  onOpen={setOpenMail} 
                  onStar={onStar} 
                  onSpam={onSpam} 
                  onNotSpam={onNotSpam} 
                  loading={loading}
                  bulkMark={bulkMark}
                />
              </div>

              {/* Resizable Divider - only visible when reading pane is open */}
              {openMail && (
                <ResizeDivider 
                  onResize={(width) => {
                    setListWidth(width);
                    localStorage.setItem("listWidth", width.toString());
                  }}
                  minLeft={280}
                  minRight={300}
                />
              )}

              {/* Reading Pane - key triggers animation on mail change */}
              {openMail && (
                <div key={openMail.id} className="flex-grow-1 d-flex flex-column minw-0 view-slide-enter" style={{ backgroundColor: "var(--bg-panel)" }}>
                  <ReadingPane 
                    mail={openMail} 
                    onClose={() => setOpenMail(null)} 
                    onReply={(mail) => {
                      setComposeData({
                        to: mail.from_addr,
                        subject: `Re: ${mail.subject}`,
                        body: `\n\nOn ${new Date(mail.received_at).toLocaleString()}, ${mail.from_addr} wrote:\n> ${mail.body_text.substring(0, 200)}...`
                      });
                      const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('composeModal'));
                      modal.show();
                    }}
                  />
                </div>
              )}
              
              {/* Placeholder for when no mail is open on large screens */}
              {!openMail && (
                <div className="d-none d-lg-flex flex-grow-1 align-items-center justify-content-center" style={{ backgroundColor: "var(--bg-hover)" }}>
                  <div className="text-center text-muted fade-in">
                    <i className="bi bi-envelope-paper-heart fs-1 mb-4 opacity-25 text-primary" />
                    <h5 className="fw-bold text-main">Your Inbox is Waiting</h5>
                    <p className="small opacity-75">Select an email to start reading</p>
                  </div>
                </div>
              )}
            </>
          ) : view === "settings" ? (
             <div className="flex-grow-1 p-5 overflow-auto fade-in">
                <div className="max-w-3xl mx-auto">
                  <header className="mb-5">
                    <button className="btn btn-light rounded-pill mb-3" onClick={() => setView("mail")}>
                      <i className="bi bi-arrow-left me-2" /> Back to Inbox
                    </button>
                    <h2 className="fw-extra-bold gradient-text">Account Settings</h2>
                    <p className="text-muted">Manage your InboXpert account and connections.</p>
                  </header>

                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <div className="card-header bg-primary text-white py-3 px-4 fw-bold">
                      Connection Status
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-4 mb-4">
                        <div className="d-flex align-items-center justify-content-center rounded-circle text-white shadow-sm fw-bold fs-4" style={{ width: 64, height: 64, background: "var(--gradient-primary)" }}>
                          {userEmail[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1 text-main">{userEmail}</h5>
                          <div className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2 fw-semibold">
                            Authenticated via Google
                          </div>
                        </div>
                      </div>
                      <div className="alert alert-info border-0 rounded-4 p-3 bg-primary-subtle text-primary">
                        <i className="bi bi-info-circle-fill me-2" /> Your emails are synchronized using OAuth 2.0 for maximum security.
                      </div>
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-light py-3 px-4 fw-bold text-main">
                      Danger Zone
                    </div>
                    <div className="card-body p-4">
                      <p className="small text-muted mb-3">Proceed with caution. These actions cannot be undone.</p>
                      <button className="btn btn-outline-danger rounded-pill fw-bold">
                         Reset Account Data
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          ) : (
            <div className="flex-grow-1 p-5 overflow-auto fade-in">
                <div className="max-w-3xl mx-auto">
                   <header className="mb-5">
                    <button className="btn btn-light rounded-pill mb-3" onClick={() => setView("mail")}>
                      <i className="bi bi-arrow-left me-2" /> Back to Inbox
                    </button>
                    <h2 className="fw-extra-bold gradient-text">General Preferences</h2>
                    <p className="text-muted">Personalize your InboXpert experience.</p>
                  </header>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                          <h5 className="fw-bold text-main mb-4">Display Theme</h5>
                          <div className="d-grid gap-3">
                            <button 
                              className={`btn py-3 rounded-4 border-2 ${theme === 'light' ? 'btn-primary border-primary' : 'btn-light'}`}
                              onClick={() => setTheme('light')}
                            >
                              <i className="bi bi-sun-fill me-2" /> Light Mode
                            </button>
                            <button 
                              className={`btn py-3 rounded-4 border-2 ${theme === 'dark' ? 'btn-primary border-primary' : 'btn-light'}`}
                              onClick={() => setTheme('dark')}
                            >
                              <i className="bi bi-moon-stars-fill me-2" /> Dark Mode
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                          <h5 className="fw-bold text-main mb-4">AI Sensitivity</h5>
                          <p className="small text-muted mb-4">Control how much the AI hallucinates vs stays factual.</p>
                          <input type="range" className="form-range" min="0" max="100" step="10" defaultValue="50" />
                          <div className="d-flex justify-content-between small text-muted mt-2">
                             <span>Strict</span>
                             <span>Balanced</span>
                             <span>Creative</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          )}
        </main>
      </div>

      <ComposeModal userEmail={userEmail} onSent={() => {}} toast={toast} initialData={composeData} />
    </div>
  );
}
