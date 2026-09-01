import { useState } from "react";
import { useNavigate } from "react-router";

import { login } from "../services/auth";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      sessionStorage.setItem("access_token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">

        <div className="login-brand" aria-hidden="true">
          <span className="login-brand-logo">Event Management AI</span>
          <h2>Quản lý sự kiện gọn gàng, có AI lo phần việc lặp lại.</h2>

          <div className="login-brand-card">
            <div className="login-brand-card-row">
              <span className="login-brand-card-time">09:00</span>
              <span>Khai mạc &amp; giới thiệu</span>
            </div>
            <div className="login-brand-card-row login-brand-card-row-active">
              <span className="login-brand-card-time">13:30</span>
              <span>Workshop AI Chatbot</span>
            </div>
          </div>
        </div>

        <div className="login-form-side">
          <form className="login-card" onSubmit={handleSubmit} noValidate>
            <h1>Đăng nhập</h1>
            <p className="login-subtitle">Truy cập bảng điều khiển ban tổ chức</p>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="error" role="alert">{error}</p>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;
