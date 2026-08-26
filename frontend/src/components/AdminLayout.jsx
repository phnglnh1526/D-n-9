import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth";


function AdminLayout() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);


  useEffect(() => {
    async function loadUser() {
      const token =
        sessionStorage.getItem("access_token");

      try {
        const data =
          await getCurrentUser(token);

        setUser(data);
      } catch {
        sessionStorage.removeItem(
          "access_token"
        );

        navigate("/login");
      }
    }

    loadUser();
  }, [navigate]);


  function logout() {
    sessionStorage.removeItem(
      "access_token"
    );

    navigate("/login");
  }


  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          <h2>Event AI</h2>
          <span>Management</span>
        </div>

        <nav
          className="sidebar-menu"
          aria-label="Điều hướng quản trị"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            Trang chủ
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            Tổng quan
          </NavLink>

          <NavLink
            to="/admin/events"
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            Quản lý sự kiện
          </NavLink>

          <NavLink
            to="/admin/registrations"
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            Đăng ký
          </NavLink>

          <NavLink
            to="/admin/check-in"
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            Check-in
          </NavLink>

          <NavLink
            to="/admin/feedback"
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            Phản hồi
          </NavLink>

          <NavLink
            to="/admin/ai"
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            Phân tích tỷ lệ tham dự
          </NavLink>

        </nav>

        <button
          className="logout-button"
          onClick={logout}
        >
          Đăng xuất
        </button>

      </aside>


      {/* PHẦN BÊN PHẢI */}
      <div className="admin-main">

        <header className="admin-header">

          <div>
            <h3>Event Management AI</h3>
          </div>

          <div className="user-info">

            {user ? (
              <>
                <strong>
                  {user.HoTen}
                </strong>

                <span>
                  {user.VaiTro}
                </span>
              </>
            ) : (
              <span>Đang tải...</span>
            )}

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