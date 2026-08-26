# Event Management AI

Ứng dụng quản lý sự kiện gồm frontend React/Vite và backend FastAPI.

## Chạy nhanh bằng SQLite

SQLite được cấu hình mặc định cho local nên không cần Docker Desktop hay MySQL.

### 1. Clone và tạo môi trường Python

```powershell
git clone <URL_REPOSITORY>
cd <TEN_REPOSITORY>
py -3.12 -m venv backend\venv
.\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Nếu máy chỉ có Python 3.13, có thể thay `py -3.12` bằng `py -3.13`.

### 2. Tạo biến môi trường

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

`DATABASE_URL` trong `.env.example` dùng SQLite:

```text
DATABASE_URL=sqlite:///./backend/event_management.db
```

Không commit `.env`; file này có thể chứa secret thật.

### 3. Tạo dữ liệu demo

```powershell
.\backend\venv\Scripts\python.exe backend\seed_demo_data.py
```

Seed có thể chạy nhiều lần và không tạo bản ghi trùng.

### 4. Chạy backend

Mở terminal thứ nhất:

```powershell
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --app-dir backend
```

Kiểm tra API:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/health/db
- http://127.0.0.1:8000/docs

### 5. Chạy frontend

Mở terminal thứ hai:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Mở http://localhost:5173/events hoặc http://localhost:5173/admin.

Tài khoản demo:

```text
Email: admin@test.com
Mật khẩu: Admin@123
```

## Dùng MySQL/Docker thay cho SQLite

Docker Desktop trên Windows cần bật virtualization. Sau khi Docker engine hoạt động:

1. Đổi `DATABASE_URL` trong `.env` sang kết nối MySQL hoặc xóa biến này để dùng các biến `MYSQL_*`.
2. Chạy:

```powershell
docker compose up -d
```

3. Khởi động lại backend.

`database/init.sql` chứa schema MySQL và dữ liệu demo `INSERT IGNORE`.

## Đưa lên GitHub và chia sẻ cho người khác

GitHub lưu source code, không tự chạy ứng dụng. Người clone repository cần cài Node.js, Python và chạy frontend/backend theo hướng dẫn trên.

Nếu muốn mọi người mở bằng một URL mà không cài gì, cần deploy riêng:

- frontend: Vercel, Netlify hoặc static hosting
- backend: Render, Railway, Fly.io hoặc server riêng
- database: MySQL/PostgreSQL managed service

Khi deploy frontend, đặt `VITE_API_URL` trỏ tới URL backend đã deploy. Không đưa `.env`, API key, JWT secret hoặc database password lên GitHub.

## Kiểm tra

```powershell
npm --prefix frontend run build
.\backend\venv\Scripts\python.exe -m compileall -q backend
```
