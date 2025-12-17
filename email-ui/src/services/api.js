export const API = import.meta?.env?.VITE_API_URL || "http://localhost:8000";

export const api = {
  list: async (folder, userEmail) => {
    const r = await fetch(`${API}/emails?folder=${encodeURIComponent(folder)}&user_email=${encodeURIComponent(userEmail || "")}`);
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
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds for model cold start
    
    try {
      const r = await fetch(`${API}/generate/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!r.ok) {
        const errorText = await r.text();
        throw new Error(errorText || `Server error: ${r.status}`);
      }
      return r.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The AI model might be loading - please try again in a moment.');
      }
      throw error;
    }
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
  summary: async (text) => {
    const r = await fetch(`${API}/generate/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, length: 3 }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
