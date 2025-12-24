import React, { useState, useRef } from "react";
import { api } from "../../services/api";

export function ComposeModal({ userEmail, onSent, toast, initialData }) {
  const [to, setTo] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("formal");
  const [length, setLength] = useState("medium");
  const [lang, setLang] = useState("en");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const closeBtn = useRef(null);

  // Load initial data when it changes
  React.useEffect(() => {
    if (initialData) {
      setTo(initialData.to || "");
      setDraft({
        subject: initialData.subject || "",
        body: initialData.body || "",
        intent: "Reply"
      });
    }
  }, [initialData]);

  const gen = async () => {
    if (!prompt.trim()) return toast({ title: "Enter a prompt", variant: "error" });
    setBusy(true);
    try {
      // Extract sender name from email (use part before @, capitalize first letter)
      const senderName = userEmail 
        ? userEmail.split('@')[0].split('.').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join(' ')
        : "";
      const d = await api.draft({ prompt, tone, length, target_lang: lang, sender_name: senderName });
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
      // Reset state
      setDraft(null);
      setPrompt("");
      setTo("");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      toast({ title: "Send failed", desc: errorMsg, variant: "error" });
    }
  };

  return (
    <div className="modal fade" id="composeModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ overflow: "hidden" }}>
          <div className="modal-header border-bottom-0">
            <h5 className="modal-title fw-bold"><i className="bi bi-pencil-square me-2" />Compose Message</h5>
            <button ref={closeBtn} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body p-4">
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase">Recipient</label>
              <input 
                className="form-control focus-ring" 
                placeholder="recipient@example.com" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
              />
            </div>
            
            <div className="p-3 rounded-4 mb-3 border shadow-sm" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border-color)" }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label small fw-bold text-primary mb-0">
                  <i className="bi bi-stars me-1" /> AI Assistant
                </label>
              </div>
              
              <div className="mb-3">
                <textarea 
                  className="form-control border-0 shadow-sm focus-ring" 
                  rows={3} 
                  placeholder="Describe what you want to say..." 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                />
              </div>
              
              <div className="row g-2">
                <div className="col-md-4">
                  <select className="form-select form-select-sm" value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option value="formal">Formal Tone</option>
                    <option value="neutral">Neutral Tone</option>
                    <option value="friendly">Friendly Tone</option>
                    <option value="persuasive">Persuasive Tone</option>
                    <option value="concise">Concise Tone</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <select className="form-select form-select-sm" value={length} onChange={(e) => setLength(e.target.value)}>
                    <option value="short">Short Length</option>
                    <option value="medium">Medium Length</option>
                    <option value="detailed">Detailed Length</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <select className="form-select form-select-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                    <option value="ta">Tamil</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3 text-end">
                <button className="btn btn-primary btn-sm" onClick={gen} disabled={busy}>
                  {busy ? <i className="bi bi-arrow-repeat spin me-1" /> : <i className="bi bi-stars me-1" />} 
                  Generate Draft
                </button>
              </div>
            </div>

            {draft && (
              <div className="border rounded-4 overflow-hidden shadow-sm" style={{ borderColor: "var(--border-color)" }}>
                <div className="px-3 py-2 border-bottom" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border-color)" }}>
                  <input 
                    className="form-control-plaintext fw-bold" 
                    value={draft.subject} 
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  />
                </div>
                <textarea 
                  className="form-control border-0 p-3 text-main" 
                  rows={8} 
                  value={draft.body} 
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  style={{ resize: "none", backgroundColor: "transparent" }}
                />
              </div>
            )}
          </div>
          <div className="modal-footer border-top-0 pt-0 pb-3 px-4">
            <button className="btn btn-light" data-bs-dismiss="modal">Discard</button>
            <button className="btn btn-primary px-4" onClick={send} disabled={!draft || busy}>
              <i className="bi bi-send me-2" /> Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
