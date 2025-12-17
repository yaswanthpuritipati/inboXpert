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
  toggleTheme
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
    <nav className="navbar navbar-expand border-bottom px-3 py-2 sticky-top" style={{ height: "64px", backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }}>
      <div className="d-flex align-items-center gap-3 w-100">
        {/* Logo / Brand */}
        <div className="d-flex align-items-center gap-2 me-4" style={{ minWidth: "200px" }}>
          <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 36, height: 36, background: "var(--gradient-primary)" }}>
            <i className="bi bi-envelope-fill text-white" />
          </div>
          <span className="fw-bold fs-5 gradient-text">InboXpert</span>
        </div>

        {/* Search Bar */}
        <div className="flex-grow-1 max-w-2xl position-relative">
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            className="form-control border-0 ps-5 py-2 rounded-pill focus-ring"
            placeholder="Search mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: "var(--bg-hover)" }}
          />
        </div>

        {/* Actions */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          <button 
            className="btn btn-light btn-icon rounded-circle" 
            onClick={toggleTheme} 
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i className={`bi ${theme === "dark" ? "bi-sun-fill" : "bi-moon-fill"}`} />
          </button>

          <button 
            className={`btn btn-light btn-icon rounded-circle ${isRefreshing ? 'refresh-spin' : ''}`} 
            onClick={handleRefresh} 
            title="Refresh"
          >
            <i className="bi bi-arrow-repeat" />
          </button>
          
          <div className="vr mx-2 h-50 my-auto" />

          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-3 fade-in">
              <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={onSync}>
                <i className="bi bi-cloud-arrow-down" />
                <span className="d-none d-sm-inline">Sync</span>
              </button>
              
              <div className="dropdown">
                <button 
                  className={`btn btn-light rounded-pill d-flex align-items-center gap-2 ps-1 pe-3 border dropdown-toggle ${showDropdown ? 'show' : ''}`}
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                >
                  <div className="d-flex align-items-center justify-content-center fw-bold rounded-circle text-white" style={{ width: 32, height: 32, background: "var(--gradient-primary)" }}>
                    {userEmail[0]?.toUpperCase()}
                  </div>
                  <span className="small fw-medium d-none d-md-block text-truncate" style={{ maxWidth: "150px" }}>
                    {userEmail}
                  </span>
                </button>
                <ul className={`dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 ${showDropdown ? 'show' : ''}`} data-bs-popper={showDropdown ? "static" : ""}>
                  <li><h6 className="dropdown-header">Signed in as <br/>{userEmail}</h6></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={() => { setShowDropdown(false); onSignOut(); }}>
                      <i className="bi bi-box-arrow-right" />
                      Sign out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 fade-in">
               <input
                className="form-control form-control-sm focus-ring"
                placeholder="Enter Gmail"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                style={{ width: "200px" }}
              />
              <a className="btn btn-primary btn-sm d-flex align-items-center gap-2" href={`${API}/auth/google`}>
                <i className="bi bi-google" />
                <span>Sign in</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

