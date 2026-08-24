import { useState } from "react";
import { useNavigate } from "react-router";

import { login } from "../services/auth";


function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    "admin@test.com"
  );

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(
        email,
        password
      );

      sessionStorage.setItem(
        "access_token",
        data.access_token
      );

      navigate("/dashboard");

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="login-page">

      <form
        className="login-card"
        onSubmit={handleSubmit}
      >
        <h1>Đăng nhập</h1>

        <p>
          Event Management AI
        </p>

        <label>Email</label>

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <label>Mật khẩu</label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Đang đăng nhập..."
            : "Đăng nhập"}
        </button>
      </form>

    </div>
  );
}


export default Login;