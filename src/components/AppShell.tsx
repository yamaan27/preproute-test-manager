import { LayoutDashboard, FolderPlus, LineChart, ChevronDown, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/useAuth";

export function AppShell() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isTestCreation = location.pathname.startsWith("/tests/") || location.pathname === "/tests/new";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: "12px" }}>
          <span className="brand-mark" style={{ background: "#2563eb", color: "#ffffff", fontWeight: 800 }}>P</span>
          <div>
            <strong>Preproute</strong>
            <small>Test Studio</small>
          </div>
        </div>
        <nav className="nav-list" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <NavLink to="/dashboard">
            <LayoutDashboard size={17} /> Dashboard
          </NavLink>
          
          <div className="nav-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 10px",
              fontSize: "13px",
              fontWeight: 600,
              color: isTestCreation ? "#ffffff" : "#94a3b8",
              background: isTestCreation ? "#1e293b" : "transparent",
              borderRadius: "6px"
            }}>
              <FolderPlus size={17} />
              <span>Test Creation</span>
            </div>
            
            {isTestCreation && (
              <div style={{ paddingLeft: "14px", display: "flex", flexDirection: "column", gap: "4px", borderLeft: "1px solid #334155", marginLeft: "18px", marginTop: "4px" }}>
                <NavLink to="/tests/new" style={{ fontSize: "12px", padding: "6px 8px" }}>
                  Create Test
                </NavLink>
                <div style={{ paddingLeft: "8px", fontSize: "12px", color: "#38bdf8", fontWeight: 600, padding: "6px 8px" }}>
                  • Chapter Wise
                </div>
              </div>
            )}
          </div>

          <NavLink to="/dashboard" style={{ opacity: 0.7 }}>
            <LineChart size={17} /> Test Tracking
          </NavLink>
        </nav>
      </aside>
      
      <div className="main-layout-wrapper" style={{ display: "flex", flexDirection: "column", minWidth: 0, flexGrow: 1 }}>
        <header className="top-header" style={{
          height: "64px",
          background: "#ffffff",
          borderBottom: "1px solid #eef1f5",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "18px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="avatar">V</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <small style={{ color: "#8a94a6", fontSize: "11px", lineHeight: "1" }}>Signed in as</small>
              <strong style={{ color: "#111827", fontSize: "13px" }}>{user?.name ?? user?.userId ?? "Admin"}</strong>
            </div>
          </div>
          <ChevronDown size={14} style={{ color: "#8a94a6", marginLeft: "-8px" }} />
          
          <button 
            onClick={onLogout} 
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              color: "#4b5563",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: "12px"
            }}
            type="button"
          >
            <LogOut size={14} /> Logout
          </button>
        </header>
        <main className="main-content" style={{ flexGrow: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
