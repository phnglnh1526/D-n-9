const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


export async function login(email, password) {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Email hoặc mật khẩu không đúng"
    );
  }

  return response.json();
}


export async function getCurrentUser(token) {
  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Phiên đăng nhập không hợp lệ"
    );
  }

  return response.json();
}