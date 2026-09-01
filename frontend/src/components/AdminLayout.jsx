import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth";

const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  Events: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>,
  Schedule: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Speakers: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  Registrations: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
  CheckIn: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><polyline points="7 12 10 15 17 8"/></svg>,
  Feedback: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>,
  AI: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
  Public: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
};

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const token = sessionStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await getCurrentUser(token);
        setUser(data);
      } catch {
        sessionStorage.removeItem("access_token");
        navigate("/login");
      }
    }

    loadUser();
  }, [navigate]);

  // Auto-close mobile sidebar drawer on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function logout() {
    sessionStorage.removeItem("access_token");
    navigate("/login");
  }

  const role = user?.VaiTro;
  const isAdmin = role === "ADMIN";
  const isOrganizer = role === "ORGANIZER";
  const isStaff = role === "STAFF";
  const isAttendee = role === "ATTENDEE";

  // Vietnamese role labels
  const roleLabels = {
    ADMIN: "Quản trị viên",
    ORGANIZER: "Ban tổ chức",
    STAFF: "Nhân viên",
    ATTENDEE: "Người tham dự",
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return ["Tổng quan"];
    if (path.includes("/admin/events")) return ["Quản lý", "Sự kiện"];
    if (path.includes("/admin/schedules")) return ["Quản lý", "Lịch trình"];
    if (path.includes("/admin/speakers")) return ["Quản lý", "Diễn giả"];
    if (path.includes("/admin/registrations")) return ["Vận hành", "Đăng ký"];
    if (path.includes("/admin/check-in")) return ["Vận hành", "Check-in"];
    if (path.includes("/admin/feedback")) return ["Phân tích", "Phản hồi"];
    if (path.includes("/admin/ai")) return ["AI", "Trợ lý"];
    if (path === "/events" || path.startsWith("/events/")) return ["Trang sự kiện"];
    return ["Event Management AI"];
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <div className={`admin-layout ${sidebarCollapsed ? "collapsed" : ""}`}>
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {sidebarCollapsed ? "»" : "«"}
        </button>

        <div className="sidebar-brand">
          <div className="brand-logo-mark">EA</div>
          <div className="brand-text">
            <h2>Event.AI</h2>
            <span>Event Management</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-section-label">Tổng quan</div>
          <NavLink
            to="/dashboard"
            title="Tổng quan"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span><Icons.Dashboard /></span>
            <span>Tổng quan</span>
          </NavLink>

          {(isAdmin || isOrganizer) && (
            <>
              <div className="sidebar-section-label">Quản lý</div>
              <NavLink
                to="/admin/events"
                title="Sự kiện"
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <span><Icons.Events /></span>
                <span>Sự kiện</span>
              </NavLink>

              <NavLink
                to="/admin/schedules"
                title="Lịch trình"
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <span><Icons.Schedule /></span>
                <span>Lịch trình</span>
              </NavLink>

              <NavLink
                to="/admin/speakers"
                title="Diễn giả"
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <span><Icons.Speakers /></span>
                <span>Diễn giả</span>
              </NavLink>
            </>
          )}

          {(isAdmin || isOrganizer || isStaff) && (
            <>
              <div className="sidebar-section-label">Vận hành</div>
              <NavLink
                to="/admin/registrations"
                title="Đăng ký"
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <span><Icons.Registrations /></span>
                <span>Đăng ký</span>
              </NavLink>

              <NavLink
                to="/admin/check-in"
                title="Check-in"
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <span><Icons.CheckIn /></span>
                <span>Check-in</span>
              </NavLink>
            </>
          )}

          {(isAdmin || isOrganizer) && (
            <>
              <div className="sidebar-section-label">Phân tích & AI</div>
              <NavLink
                to="/admin/feedback"
                title="Phản hồi"
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <span><Icons.Feedback /></span>
                <span>Phản hồi</span>
              </NavLink>

              <NavLink
                to="/admin/ai"
                title="Trợ lý AI"
                className={({ isActive }) =>
                  isActive ? "menu-item active" : "menu-item"
                }
              >
                <span><Icons.AI /></span>
                <span>Trợ lý AI</span>
              </NavLink>
            </>
          )}

          <div className="sidebar-divider" style={{ marginTop: "auto" }} />

          <NavLink
            to="/events"
            title="Trang sự kiện"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <span><Icons.Public /></span>
            <span>Trang sự kiện</span>
          </NavLink>
        </nav>

        <div className="sidebar-profile">
          {user ? (
            <>
              <div className="profile-avatar">{getInitials(user.HoTen)}</div>
              <div className="profile-info">
                <span className="profile-name">{user.HoTen}</span>
                <span className="profile-role">{roleLabels[user.VaiTro] || user.VaiTro}</span>
              </div>
            </>
          ) : (
            <div className="profile-info">
              <span className="profile-name">Đang tải...</span>
            </div>
          )}
          
          <button
            type="button"
            className="profile-logout-btn"
            onClick={logout}
            title="Đăng xuất"
          >
            <Icons.Logout />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Mở menu"
            >
              ☰
            </button>
            <div className="header-breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb} className="breadcrumb-item">
                  {crumb}
                  {index < breadcrumbs.length - 1 && (
                    <span className="breadcrumb-separator">/</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;