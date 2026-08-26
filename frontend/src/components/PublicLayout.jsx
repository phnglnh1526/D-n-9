import {
  Link,
  NavLink,
  Outlet,
} from "react-router";


function getNavClass({ isActive }) {
  return isActive
    ? "public-nav-link active"
    : "public-nav-link";
}


function PublicHeader() {
  const isAuthenticated = Boolean(
    sessionStorage.getItem("access_token")
  );

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link
          className="public-brand"
          to="/"
          aria-label="Event AI - Trang chủ"
        >
          <span
            className="public-brand-mark"
            aria-hidden="true"
          >
            EA
          </span>

          <span className="public-brand-copy">
            <strong>Event AI</strong>
            <small>Quản lý sự kiện</small>
          </span>
        </Link>

        <nav
          className="public-nav"
          aria-label="Điều hướng chính"
        >
          <NavLink
            to="/"
            end
            className={getNavClass}
          >
            Trang chủ
          </NavLink>

          <NavLink
            to="/events"
            className={getNavClass}
          >
            Sự kiện
          </NavLink>

          <NavLink
            to="/admin/ai"
            className={({ isActive }) =>
              isActive
                ? "public-nav-link public-ai-link active"
                : "public-nav-link public-ai-link"
            }
          >
            Phân tích tỷ lệ tham dự
          </NavLink>
        </nav>

        <div className="public-header-actions">
          <Link
            className="public-admin-link"
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
          >
            {isAuthenticated
              ? "Admin"
              : "Đăng nhập quản trị"}
          </Link>
        </div>
      </div>
    </header>
  );
}


function PublicLayout() {
  return (
    <div className="public-layout">
      <PublicHeader />

      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}


export default PublicLayout;
