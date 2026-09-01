# 🌟 EVENT.AI - BACKEND API (FASTAPI)

Hệ thống Backend API cho nền tảng Quản lý Sự kiện Tích hợp Trí tuệ Nhân tạo.

---

## 🚀 1. HƯỚNG DẪN KHỞI CHẠY BACKEND

```bash
cd backend
python -m venv .venv

# Kích hoạt môi trường ảo:
.\.venv\Scripts\activate      # Trên Windows
source .venv/bin/activate       # Trên Linux/macOS

# Cài đặt thư viện:
pip install -r requirements.txt

# Khởi tạo dữ liệu mẫu (Seed Data):
python seed_data.py

# Chạy server FastAPI:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* **Swagger API Documentation**: `http://127.0.0.1:8000/docs`
* **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 👥 2. TÀI KHOẢN TRẢI NGHIỆM MẪU

| Vai trò | Email đăng nhập | Mật khẩu |
| :--- | :--- | :--- |
| **👑 ADMIN** | `admin@test.com` | `Admin@123` |
| **🏢 ORGANIZER** | `organizer@test.com` | `Organizer@123` |
| **🎫 STAFF** | `staff@test.com` | `Staff@123` |
| **🙋 ATTENDEE** | `attendee@test.com` | `Attendee@123` |

---

## 📂 3. CẤU TRÚC MÃ NGUỒN BACKEND

* `app/main.py`: Khởi tạo ứng dụng FastAPI, middleware CORS, healthcheck.
* `app/models.py`: Định nghĩa các bảng SQLAlchemy ORM (`NguoiDung`, `SuKien`, `PhienSuKien`, `DienGia`, `DangKy`, `CheckIn`, `PhanHoi`, `ThongBao`).
* `app/schemas.py`: Định nghĩa Pydantic Schemas cho request/response validation.
* `app/auth_service.py`: Xử lý JWT Token, Hash Password (Bcrypt), phân quyền theo vai trò (RBAC).
* `app/ai_service.py`: Xử lý AI Feedback Summary, AI Announcement Generator, AI Chatbot (hỗ trợ cả OpenAI và Mock DB Engine).
* `app/routers/`: Các bộ điều hướng API theo từng phân hệ nghiệp vụ (`auth`, `users`, `events`, `schedules`, `speakers`, `registrations`, `feedback`, `ai`).
* `seed_data.py`: Script tạo dữ liệu mẫu sẵn cho buổi bảo vệ đồ án.
