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
      />

      <div className="flex-grow-1 d-flex overflow-hidden">
        <Sidebar 
          folder={folder} 
          setFolder={setFolder} 
          onCompose={() => {
            setComposeData(null);
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('composeModal'));
            modal.show();
          }}
        />

        <main className="flex-grow-1 d-flex minw-0 bg-white m-3 rounded-4 shadow-sm overflow-hidden border">
          {/* Email List */}
          <div 
            className={`${openMail ? 'd-none d-lg-flex' : 'd-flex'} flex-column minw-0 border-end`} 
            style={{ 
              width: openMail ? `${listWidth}px` : "100%",
              minWidth: openMail ? "280px" : undefined,
              flexShrink: 0
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

          {/* Reading Pane */}
          {openMail && (
            <div className="flex-grow-1 d-flex flex-column minw-0 bg-white">
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
              <div className="text-center text-muted">
                <i className="bi bi-envelope fs-1 mb-3 opacity-25" />
                <p>Select an email to read</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <ComposeModal userEmail={userEmail} onSent={() => {}} toast={toast} initialData={composeData} />
    </div>
  );
}
