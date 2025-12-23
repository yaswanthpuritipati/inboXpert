import React from "react";
import { API } from "../../services/api";

export function TopBar({ 
  search, 
  setSearch, 
  userEmail, 
  setUserEmail, 
  isAuthenticated, 
  onSignIn, 
  onSignOut, 
  onSync, 
  onRefresh,
  theme,
  toggleTheme,
  onOpenSettings,
  onOpenPreferences
}) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <nav className="navbar navbar-expand border-bottom px-4 py-2 sticky-top transition-all" style={{ height: "72px", backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }}>
      <div className="d-flex align-items-center gap-4 w-100">
        {/* Logo / Brand */}
        <div className="d-flex align-items-center gap-3 me-4" style={{ minWidth: "220px" }}>
          <div className="d-flex align-items-center justify-content-center rounded-3 shadow-sm" style={{ width: 40, height: 40, background: "var(--gradient-primary)" }}>
            <i className="bi bi-envelope-heart-fill text-white fs-5" />
          </div>
          <span className="fw-extra-bold fs-4 gradient-text" style={{ letterSpacing: "-0.02em" }}>InboXpert</span>
        </div>

        {/* Search Bar */}
        <div className="flex-grow-1 max-w-2xl position-relative d-none d-md-block" style={{ maxWidth: "600px" }}>
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted opacity-50" />
          <input
            className="form-control border-0 ps-5 py-2 rounded-4 focus-ring transition-all"
            placeholder="Search mail, contacts, or tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: "var(--bg-hover)", height: "44px" }}
          />
        </div>

        {/* Actions */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          <button 
            className="btn btn-light btn-icon rounded-circle shadow-sm hover-bg-light" 
            onClick={toggleTheme} 
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i className={`bi ${theme === "dark" ? "bi-sun-fill text-warning" : "bi-moon-stars-fill text-primary"}`} />
          </button>

          <button 
            className={`btn btn-light btn-icon rounded-circle shadow-sm hover-bg-light ${isRefreshing ? 'refresh-spin' : ''}`} 
            onClick={handleRefresh} 
            title="Refresh"
          >
            <i className="bi bi-arrow-repeat text-secondary" />
          </button>
          
          <div className="vr mx-2 opacity-10 h-50 my-auto" />

          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-3 fade-in">
              <button className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-2 px-3 py-2 fw-semibold" onClick={onSync}>
                <i className="bi bi-cloud-arrow-down-fill" />
                <span className="d-none d-lg-inline">Sync Workspace</span>
              </button>
              
              <div className="dropdown">
                <button 
                  className={`btn btn-light rounded-pill d-flex align-items-center gap-2 ps-1 pe-3 border-0 shadow-sm dropdown-toggle ${showDropdown ? 'show active' : ''}`}
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                  style={{ height: "44px" }}
                >
                  <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle text-white shadow-sm" style={{ width: 36, height: 36, background: "var(--gradient-primary)" }}>
                    {userEmail[0]?.toUpperCase()}
                  </div>
                  <span className="small fw-bold d-none d-md-block text-main">
                    {userEmail.split('@')[0]}
                  </span>
                </button>
                <div 
                  className={`dropdown-menu dropdown-menu-end shadow-lg border-0 p-2 mt-2 rounded-4 animate-scale-in ${showDropdown ? 'show' : ''}`} 
                  style={{ minWidth: "240px", backgroundColor: "var(--bg-panel)", backdropFilter: "blur(12px)" }}
                >
                  <div className="px-3 py-3 border-bottom mb-2" style={{ borderColor: "var(--border-color)" }}>
                    <p className="small mb-0 fw-medium" style={{ color: "var(--text-muted)" }}>Logged in as</p>
                    <p className="fw-bold mb-0" style={{ color: "var(--text-main)" }}>{userEmail}</p>
                  </div>
                  <button className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-3 text-main" onClick={() => { setShowDropdown(false); onOpenSettings(); }}>
                    <i className="bi bi-person-circle opacity-75" />
                    <span className="fw-medium">Account Settings</span>
                  </button>
                  <button className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-3 text-main" onClick={() => { setShowDropdown(false); onOpenPreferences(); }}>
                    <i className="bi bi-gear-fill opacity-75" />
                    <span className="fw-medium">Preferences</span>
                  </button>
                  <div className="dropdown-divider opacity-10" />
                  <button className="dropdown-item text-danger rounded-3 py-2 d-flex align-items-center gap-3" onClick={() => { setShowDropdown(false); onSignOut(); }}>
                    <i className="bi bi-box-arrow-right" />
                    <span className="fw-bold">Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 fade-in">
               <input
                className="form-control form-control-sm rounded-pill focus-ring d-none d-lg-block"
                placeholder="Enter Gmail"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                style={{ width: "200px", height: "36px" }}
              />
              <a className="btn btn-primary rounded-pill btn-sm d-flex align-items-center gap-2 px-4 py-2 shadow-md" href={`${API}/auth/google`}>
                <i className="bi bi-google" />
                <span className="fw-bold">Sign in with Google</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

