import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { login, getCurrentUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("organizer@test.com");
  const [password, setPassword] = useState("Organizer@123");
  const [activeRole, setActiveRole] = useState("ORGANIZER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      const token = data.access_token;
      sessionStorage.setItem("access_token", token);

      // Fetch user profile to determine role-based redirect
      try {
        const userInfo = await getCurrentUser(token);
        if (userInfo?.VaiTro === "ATTENDEE") {
          navigate("/events");
        } else {
          navigate("/dashboard");
        }
      } catch {
        // Fallback to dashboard if user fetch fails
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectQuickAccount(role, mail, pass) {
    setActiveRole(role);
    setEmail(mail);
    setPassword(pass);
    setError("");
  }

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* LEFT COLUMN: BRANDING & HERO */}
        <div className="login-brand-panel">
          <div className="login-brand-top">
            <span className="login-brand-badge">✨ Event Management AI Platform</span>
            <h2>Event.AI</h2>
            <p>
              Hệ thống Quản lý Sự kiện Thông minh & Trợ lý Tương tác Toàn diện.
            </p>

            <div className="login-features-list">
              <div className="login-feature-item">
                <div className="login-feature-icon">📊</div>
                <div>
                  <strong>Bảng Thống Kê Thời Gian Thực</strong>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Theo dõi số lượt đăng ký & tỷ lệ check-in chính xác.
                  </div>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon">🎟️</div>
                <div>
                  <strong>Vé Điện Tử & Quét Mã QR</strong>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Đăng ký trực tuyến, sinh vé QR và xác nhận check-in nhanh.
                  </div>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon">🤖</div>
                <div>
                  <strong>Trí Tuệ Nhân Tạo (AI Suite)</strong>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Tóm tắt phản hồi, soạn thảo thông báo & AI Chatbot hỏi đáp.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="login-brand-footer">
            © 2026 Event.AI System. Thiết kế phục vụ báo cáo và bảo vệ đồ án.
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h1>Đăng nhập hệ thống</h1>
            <p>Chọn tài khoản demo bên dưới hoặc nhập thông tin đăng nhập</p>
          </div>

          {/* QUICK DEMO ACCOUNTS */}
          <div className="demo-accounts-box">
            <div className="demo-accounts-title">
              <span>⚡ Chọn nhanh tài khoản Demo:</span>
            </div>

            <div className="demo-grid">
              <button
                type="button"
                className={`demo-btn ${activeRole === "ORGANIZER" ? "active" : ""}`}
                onClick={() => handleSelectQuickAccount("ORGANIZER", "organizer@test.com", "Organizer@123")}
              >
                🏢 Organizer
              </button>

              <button
                type="button"
                className={`demo-btn ${activeRole === "ADMIN" ? "active" : ""}`}
                onClick={() => handleSelectQuickAccount("ADMIN", "admin@test.com", "Admin@123")}
              >
                👑 Admin
              </button>

              <button
                type="button"
                className={`demo-btn ${activeRole === "STAFF" ? "active" : ""}`}
                onClick={() => handleSelectQuickAccount("STAFF", "staff@test.com", "Staff@123")}
              >
                🎫 Staff
              </button>

              <button
                type="button"
                className={`demo-btn ${activeRole === "ATTENDEE" ? "active" : ""}`}
                onClick={() => handleSelectQuickAccount("ATTENDEE", "attendee@test.com", "Attendee@123")}
              >
                🙋 Attendee
              </button>
            </div>
          </div>

          {error && <div className="alert error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email tài khoản *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveRole("");
                }}
                placeholder="example@test.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setActiveRole("");
                }}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button"
              style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "14px" }}
            >
              {loading ? "🔄 Đang xác thực..." : "Đăng nhập ngay 🚀"}
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <Link
              to="/events"
              style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              ← Quay lại Cổng sự kiện công khai (Public Events)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;