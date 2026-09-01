import os
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")

from app.database import SessionLocal, engine
from app.models import NguoiDung, DienGia, SuKien, PhienSuKien, DangKy, PhanHoi, CauHoiThuongGap, ThongBao
from app.auth_service import hash_password

def seed_database():
    db = SessionLocal()
    try:
        # 1. Check or Create Users
        admin = db.query(NguoiDung).filter(NguoiDung.Email == "admin@test.com").first()
        if not admin:
            admin = NguoiDung(
                HoTen="Admin Quản Trị",
                Email="admin@test.com",
                MatKhauHash=hash_password("Admin@123"),
                VaiTro="ADMIN",
                NgayTao=datetime.now()
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        organizer = db.query(NguoiDung).filter(NguoiDung.Email == "organizer@test.com").first()
        if not organizer:
            organizer = NguoiDung(
                HoTen="Nguyễn Ban Tổ Chức",
                Email="organizer@test.com",
                MatKhauHash=hash_password("Organizer@123"),
                VaiTro="ORGANIZER",
                NgayTao=datetime.now()
            )
            db.add(organizer)
            db.commit()
            db.refresh(organizer)

        staff = db.query(NguoiDung).filter(NguoiDung.Email == "staff@test.com").first()
        if not staff:
            staff = NguoiDung(
                HoTen="Trần Nhân Viên Check-in",
                Email="staff@test.com",
                MatKhauHash=hash_password("Staff@123"),
                VaiTro="STAFF",
                NgayTao=datetime.now()
            )
            db.add(staff)
            db.commit()
            db.refresh(staff)

        attendee = db.query(NguoiDung).filter(NguoiDung.Email == "attendee@test.com").first()
        if not attendee:
            attendee = NguoiDung(
                HoTen="Phạm Người Tham Dự",
                Email="attendee@test.com",
                MatKhauHash=hash_password("Attendee@123"),
                VaiTro="ATTENDEE",
                NgayTao=datetime.now()
            )
            db.add(attendee)
            db.commit()
            db.refresh(attendee)

        # 2. Check or Create Speakers (DienGia)
        speakers = db.query(DienGia).all()
        if not speakers:
            spk1 = DienGia(
                HoTen="TS. Lê Hoàng Nam",
                ChucDanh="Chuyên gia AI & Deep Learning",
                DonVi="Viện Trí tuệ Nhân tạo Ứng dụng",
                GioiThieu="Hơn 12 năm nghiên cứu về AI/ML, NLP và các mô hình ngôn ngữ lớn (LLM)."
            )
            spk2 = DienGia(
                HoTen="ThS. Trần Thị Mai",
                ChucDanh="Lead Software Architect",
                DonVi="Tập đoàn Công nghệ TechViet",
                GioiThieu="Chuyên gia thiết kế kiến trúc hệ thống phân tán và Cloud Native."
            )
            db.add_all([spk1, spk2])
            db.commit()
            db.refresh(spk1)
            db.refresh(spk2)
        else:
            spk1, spk2 = speakers[0], speakers[1] if len(speakers) > 1 else speakers[0]

        # 3. Create Events if none exist
        existing_events = db.query(SuKien).all()
        if not existing_events:
            now = datetime.now()
            
            # Event 1: AI Summit 2026
            event1 = SuKien(
                NguoiToChucId=admin.NguoiDungId,
                TenSuKien="Hội thảo Quốc tế về Trí tuệ Nhân tạo & Tương lai Công nghệ 2026",
                MoTa="Khám phá các bước đột phá mới nhất trong trí tuệ nhân tạo, Generative AI và ứng dụng thực tiễn trong chuyển đổi số doanh nghiệp.",
                ThoiGianBatDau=now + timedelta(days=2, hours=8),
                ThoiGianKetThuc=now + timedelta(days=2, hours=17),
                DiaDiem="Trung tâm Hội nghị Quốc gia, 57 Phạm Hùng, Hà Nội",
                TrangThai="DA_DUYET",
                NgayTao=now - timedelta(days=5)
            )

            # Event 2: Tech Workshop
            event2 = SuKien(
                NguoiToChucId=organizer.NguoiDungId,
                TenSuKien="Workshop: Xây dựng và Triển khai Ứng dụng Web Hiện Đại với React & FastAPI",
                MoTa="Thực hành xây dựng ứng dụng Fullstack từ con số 0, tích hợp AI API và triển khai ứng dụng thực tế.",
                ThoiGianBatDau=now + timedelta(days=5, hours=9),
                ThoiGianKetThuc=now + timedelta(days=5, hours=12),
                DiaDiem="Phòng Hội thảo Tầng 8, Tòa nhà Innovation, TP. Hồ Chí Minh",
                TrangThai="DA_DUYET",
                NgayTao=now - timedelta(days=3)
            )

            # Event 3: Draft event
            event3 = SuKien(
                NguoiToChucId=admin.NguoiDungId,
                TenSuKien="Diễn đàn Khởi nghiệp Sáng tạo Trẻ & Gọi vốn Đầu tư",
                MoTa="Không gian kết nối giữa các nhà sáng lập trẻ, các quỹ đầu tư mạo hiểm và chuyên gia hàng đầu.",
                ThoiGianBatDau=now + timedelta(days=15, hours=13),
                ThoiGianKetThuc=now + timedelta(days=15, hours=18),
                DiaDiem="Hội trường Diamond Hall, Đà Nẵng",
                TrangThai="NHAP",
                NgayTao=now - timedelta(days=1)
            )

            db.add_all([event1, event2, event3])
            db.commit()
            db.refresh(event1)
            db.refresh(event2)
            db.refresh(event3)

            # 4. Sessions
            session1 = PhienSuKien(
                SuKienId=event1.SuKienId,
                DienGiaId=spk1.DienGiaId,
                TieuDe="Khai mạc & Toàn cảnh xu hướng AI 2026",
                MoTa="Tổng quan về làn sóng AI mới, các cơ hội và thách thức.",
                ThoiGianBatDau=event1.ThoiGianBatDau,
                ThoiGianKetThuc=event1.ThoiGianBatDau + timedelta(hours=2),
                DiaDiem="Hội trường chính A1"
            )
            session2 = PhienSuKien(
                SuKienId=event1.SuKienId,
                DienGiaId=spk2.DienGiaId,
                TieuDe="Kiến trúc ứng dụng doanh nghiệp tích hợp AI",
                MoTa="Kinh nghiệm thực chiến triển khai AI quy mô lớn an toàn và hiệu quả.",
                ThoiGianBatDau=event1.ThoiGianBatDau + timedelta(hours=2, minutes=30),
                ThoiGianKetThuc=event1.ThoiGianBatDau + timedelta(hours=4),
                DiaDiem="Hội trường chính A1"
            )
            db.add_all([session1, session2])

            # 5. FAQs
            faq1 = CauHoiThuongGap(
                SuKienId=event1.SuKienId,
                CauHoi="Sự kiện có cấp chứng nhận tham gia (Certificate) không?",
                CauTraLoi="Có, ban tổ chức sẽ gửi E-Certificate qua email cho tất cả người tham dự đã hoàn tất check-in sau sự kiện.",
                NgayTao=now
            )
            faq2 = CauHoiThuongGap(
                SuKienId=event1.SuKienId,
                CauHoi="Địa điểm có bãi đỗ xe ô tô và xe máy không?",
                CauTraLoi="Địa điểm có bãi giữ xe tầng hầm rộng rãi miễn phí cho khách tham gia sự kiện.",
                NgayTao=now
            )
            faq3 = CauHoiThuongGap(
                SuKienId=event1.SuKienId,
                CauHoi="Tôi có cần mang theo laptop không?",
                CauTraLoi="Bạn nên mang theo laptop nếu muốn tham gia phiên thực hành trực tiếp tại buổi chiều.",
                NgayTao=now
            )
            db.add_all([faq1, faq2, faq3])

            # 6. Registrations
            reg1 = DangKy(
                SuKienId=event1.SuKienId,
                HoTen="Nguyễn Văn An",
                Email="nguyenvanan@gmail.com",
                SoDienThoai="0912345678",
                MaDangKy="REG-AI2026-001",
                MaQR="QR-AI2026-001",
                ThoiGianDangKy=now - timedelta(days=2),
                TrangThai="DA_DANG_KY",
                DaCheckIn=True,
                ThoiGianCheckIn=now - timedelta(hours=3),
                PhuongThucCheckIn="QR"
            )
            reg2 = DangKy(
                SuKienId=event1.SuKienId,
                HoTen="Trần Thị Bích",
                Email="tranbich@gmail.com",
                SoDienThoai="0987654321",
                MaDangKy="REG-AI2026-002",
                MaQR="QR-AI2026-002",
                ThoiGianDangKy=now - timedelta(days=1),
                TrangThai="DA_DANG_KY",
                DaCheckIn=True,
                ThoiGianCheckIn=now - timedelta(hours=2),
                PhuongThucCheckIn="MANUAL"
            )
            reg3 = DangKy(
                SuKienId=event1.SuKienId,
                HoTen="Phạm Minh Cường",
                Email="minhcuong@gmail.com",
                SoDienThoai="0905123456",
                MaDangKy="REG-AI2026-003",
                MaQR="QR-AI2026-003",
                ThoiGianDangKy=now - timedelta(hours=10),
                TrangThai="DA_DANG_KY",
                DaCheckIn=False
            )
            db.add_all([reg1, reg2, reg3])
            db.commit()
            db.refresh(reg1)
            db.refresh(reg2)
            db.refresh(reg3)

            # 7. Feedbacks
            fb1 = PhanHoi(
                DangKyId=reg1.DangKyId,
                DiemDanhGia=5,
                NoiDung="Sự kiện rất tuyệt vời! Diễn giả chia sẻ nhiều kiến thức thực tế và hữu ích về AI. Không gian hội thảo tổ chức chuyên nghiệp.",
                NgayTao=now - timedelta(hours=1)
            )
            fb2 = PhanHoi(
                DangKyId=reg2.DangKyId,
                DiemDanhGia=5,
                NoiDung="Cách trình bày dễ hiểu, nhiều case study thực tế. Rất mong ban tổ chức tiếp tục tổ chức các sự kiện tiếp theo!",
                NgayTao=now - timedelta(minutes=30)
            )
            db.add_all([fb1, fb2])

            # 8. Notifications
            tb1 = ThongBao(
                SuKienId=event1.SuKienId,
                TieuDe="Nhắc lịch: Hội thảo Quốc tế về Trí tuệ Nhân tạo 2026",
                NoiDung="Sự kiện sẽ bắt đầu vào ngày kia tại Trung tâm Hội nghị Quốc gia. Vui lòng chuẩn bị mã QR để check-in nhanh chóng.",
                LoaiThongBao="NHAC_LICH",
                NgayTao=now - timedelta(days=1)
            )
            db.add(tb1)
            db.commit()

            print("Database seeded successfully with sample events, sessions, registrations, feedbacks, and FAQs!")
        else:
            print(f"Database already contains {len(existing_events)} events.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
