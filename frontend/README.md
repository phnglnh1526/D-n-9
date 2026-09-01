# 🌟 EVENT.AI - FRONTEND (REACT + VITE)

Giao diện người dùng hiện đại, trực quan dành cho Hệ thống Quản lý Sự kiện Tích hợp Trí tuệ Nhân tạo.

---

## 🚀 1. HƯỚNG DẪN KHỞI CHẠY FRONTEND

```bash
cd frontend
npm install
npm run dev
```

* **Địa chỉ truy cập**: `http://localhost:5173`

---

## 👥 2. PHÂN HỆ VÀ ĐIỀU HƯỚNG GIAO DIỆN

* `/events`: Cổng thông tin sự kiện công khai (Danh sách sự kiện, chi tiết & đăng ký vé QR).
* `/feedback`: Trang đánh giá và gửi phản hồi 1-5 sao dành cho người tham dự.
* `/login`: Trang đăng nhập hệ thống (Tích hợp 4 nút bấm chọn nhanh tài khoản demo).
* `/dashboard`: Bảng thống kê & Quản trị dành cho Organizer (5 chỉ số cốt lõi, thanh tiến độ Check-in, điểm feedback).
* `/admin/events`: Quản lý danh sách sự kiện, thêm mới, sửa, đổi trạng thái.
* `/admin/schedules`: Quản lý các phiên lịch trình theo từng sự kiện.
* `/admin/speakers`: Quản lý danh sách diễn giả và chuyên gia.
* `/admin/registrations`: Quản lý danh sách đăng ký tham dự.
* `/admin/check-in`: Tra cứu mã đăng ký/QR và xác nhận Check-in người tham dự.
* `/admin/feedback`: Quản lý phản hồi và Phân tích tóm tắt phản hồi bằng AI.
* `/admin/ai`: Trung tâm Trí tuệ nhân tạo (AI Soạn thảo thông báo & AI Chatbot hỏi đáp dữ liệu sự kiện).
