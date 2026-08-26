from datetime import datetime

from app.auth_service import hash_password
from app.database import Base, SessionLocal, engine
from app.models import (
    CauHoiThuongGap,
    DangKy,
    DienGia,
    NguoiDung,
    PhanHoi,
    PhienSuKien,
    SuKien,
    ThongBao,
)


DEMO_PASSWORD = "Admin@123"


def get_or_create_user(db, *, ho_ten, email, vai_tro):
    user = (
        db.query(NguoiDung)
        .filter(NguoiDung.Email == email)
        .first()
    )

    if user is None:
        user = NguoiDung(
            HoTen=ho_ten,
            Email=email,
            MatKhauHash=hash_password(DEMO_PASSWORD),
            VaiTro=vai_tro,
            NgayTao=datetime(2026, 8, 26, 8, 0),
        )
        db.add(user)
        db.flush()

    return user


def get_or_create_speaker(db, *, ho_ten, chuc_danh, don_vi, gioi_thieu):
    speaker = (
        db.query(DienGia)
        .filter(DienGia.HoTen == ho_ten)
        .first()
    )

    if speaker is None:
        speaker = DienGia(
            HoTen=ho_ten,
            ChucDanh=chuc_danh,
            DonVi=don_vi,
            GioiThieu=gioi_thieu,
        )
        db.add(speaker)
        db.flush()

    return speaker


def get_or_create_event(
    db,
    *,
    organizer_id,
    name,
    description,
    start,
    end,
    location,
    status,
):
    event = (
        db.query(SuKien)
        .filter(SuKien.TenSuKien == name)
        .first()
    )

    if event is None:
        event = SuKien(
            NguoiToChucId=organizer_id,
            TenSuKien=name,
            MoTa=description,
            ThoiGianBatDau=start,
            ThoiGianKetThuc=end,
            DiaDiem=location,
            TrangThai=status,
            NgayTao=datetime(2026, 8, 26, 8, 30),
        )
        db.add(event)
        db.flush()

    return event


def get_or_create_session(
    db,
    *,
    event_id,
    speaker_id,
    title,
    description,
    start,
    end,
    location,
):
    session = (
        db.query(PhienSuKien)
        .filter(
            PhienSuKien.SuKienId == event_id,
            PhienSuKien.TieuDe == title,
        )
        .first()
    )

    if session is None:
        session = PhienSuKien(
            SuKienId=event_id,
            DienGiaId=speaker_id,
            TieuDe=title,
            MoTa=description,
            ThoiGianBatDau=start,
            ThoiGianKetThuc=end,
            DiaDiem=location,
        )
        db.add(session)
        db.flush()

    return session


def get_or_create_registration(
    db,
    *,
    event_id,
    ho_ten,
    email,
    phone,
    registration_code,
    qr_code,
    checked_in,
    check_in_time=None,
    check_in_method=None,
):
    registration = (
        db.query(DangKy)
        .filter(
            DangKy.SuKienId == event_id,
            DangKy.Email == email,
        )
        .first()
    )

    if registration is None:
        registration = DangKy(
            SuKienId=event_id,
            HoTen=ho_ten,
            Email=email,
            SoDienThoai=phone,
            MaDangKy=registration_code,
            MaQR=qr_code,
            ThoiGianDangKy=datetime(2026, 8, 27, 9, 0),
            TrangThai="DA_DANG_KY",
            DaCheckIn=checked_in,
            ThoiGianCheckIn=check_in_time,
            PhuongThucCheckIn=check_in_method,
        )
        db.add(registration)
        db.flush()

    return registration


def create_feedback_if_missing(db, *, registration_id, score, content, created_at):
    feedback = (
        db.query(PhanHoi)
        .filter(PhanHoi.DangKyId == registration_id)
        .first()
    )

    if feedback is None:
        db.add(
            PhanHoi(
                DangKyId=registration_id,
                DiemDanhGia=score,
                NoiDung=content,
                NgayTao=created_at,
            )
        )


def create_faq_if_missing(db, *, event_id, question, answer, created_at):
    faq = (
        db.query(CauHoiThuongGap)
        .filter(
            CauHoiThuongGap.SuKienId == event_id,
            CauHoiThuongGap.CauHoi == question,
        )
        .first()
    )

    if faq is None:
        db.add(
            CauHoiThuongGap(
                SuKienId=event_id,
                CauHoi=question,
                CauTraLoi=answer,
                NgayTao=created_at,
            )
        )


def create_notification_if_missing(
    db,
    *,
    event_id,
    title,
    content,
    notification_type,
    created_at,
):
    notification = (
        db.query(ThongBao)
        .filter(
            ThongBao.SuKienId == event_id,
            ThongBao.TieuDe == title,
        )
        .first()
    )

    if notification is None:
        db.add(
            ThongBao(
                SuKienId=event_id,
                TieuDe=title,
                NoiDung=content,
                LoaiThongBao=notification_type,
                NgayTao=created_at,
                ThoiGianGui=None,
            )
        )


def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin = get_or_create_user(
            db,
            ho_ten="Admin Demo",
            email="admin@test.com",
            vai_tro="ADMIN",
        )
        organizer = get_or_create_user(
            db,
            ho_ten="Nguyễn Minh Anh",
            email="organizer@test.com",
            vai_tro="ORGANIZER",
        )
        get_or_create_user(
            db,
            ho_ten="Trần Quốc Bảo",
            email="staff@test.com",
            vai_tro="STAFF",
        )

        speaker_1 = get_or_create_speaker(
            db,
            ho_ten="Lê Minh Khôi",
            chuc_danh="Chuyên gia chuyển đổi số",
            don_vi="FutureLab Vietnam",
            gioi_thieu="Tư vấn chiến lược dữ liệu và tự động hóa cho doanh nghiệp.",
        )
        speaker_2 = get_or_create_speaker(
            db,
            ho_ten="Phạm Thu Hà",
            chuc_danh="Product Lead",
            don_vi="Innovate Hub",
            gioi_thieu="Hơn 10 năm xây dựng sản phẩm số lấy người dùng làm trung tâm.",
        )
        speaker_3 = get_or_create_speaker(
            db,
            ho_ten="Ngô Hoàng Nam",
            chuc_danh="Giảng viên công nghệ",
            don_vi="Đại học Công nghệ",
            gioi_thieu="Nghiên cứu AI ứng dụng và hệ thống thông tin doanh nghiệp.",
        )

        event_1 = get_or_create_event(
            db,
            organizer_id=organizer.NguoiDungId,
            name="AI trong quản lý sự kiện hiện đại",
            description="Khám phá cách AI hỗ trợ lập kế hoạch, vận hành và đo lường trải nghiệm người tham dự.",
            start=datetime(2026, 9, 15, 8, 30),
            end=datetime(2026, 9, 15, 17, 0),
            location="Hội trường A - Đại học Công nghệ",
            status="DA_DUYET",
        )
        event_2 = get_or_create_event(
            db,
            organizer_id=organizer.NguoiDungId,
            name="Product Discovery Bootcamp",
            description="Một ngày thực hành khám phá vấn đề, phỏng vấn người dùng và xây dựng MVP.",
            start=datetime(2026, 10, 3, 9, 0),
            end=datetime(2026, 10, 3, 16, 30),
            location="Innovate Hub - Tầng 5",
            status="DA_DUYET",
        )
        event_3 = get_or_create_event(
            db,
            organizer_id=admin.NguoiDungId,
            name="Vietnam Tech Connect 2026",
            description="Không gian kết nối cộng đồng công nghệ, chia sẻ xu hướng và mở rộng hợp tác.",
            start=datetime(2026, 7, 20, 8, 0),
            end=datetime(2026, 7, 20, 15, 0),
            location="Trung tâm hội nghị Riverside",
            status="DA_KET_THUC",
        )

        sessions = [
            (event_1, speaker_1, "Khai mạc và xu hướng AI trong vận hành sự kiện", "Tổng quan các cơ hội ứng dụng AI trong toàn bộ vòng đời sự kiện.", datetime(2026, 9, 15, 9, 0), datetime(2026, 9, 15, 10, 0)),
            (event_1, speaker_2, "Thiết kế trải nghiệm người tham dự bằng dữ liệu", "Dùng dữ liệu để cá nhân hóa hành trình trước, trong và sau sự kiện.", datetime(2026, 9, 15, 10, 30), datetime(2026, 9, 15, 11, 30)),
            (event_1, speaker_3, "Panel: Từ đăng ký đến check-in thông minh", "Thảo luận thực tế về tự động hóa đăng ký, QR và phân tích phản hồi.", datetime(2026, 9, 15, 14, 0), datetime(2026, 9, 15, 15, 30)),
            (event_2, speaker_2, "Tư duy sản phẩm cho người mới", "Các nguyên tắc nền tảng để xác định đúng vấn đề cần giải quyết.", datetime(2026, 10, 3, 9, 30), datetime(2026, 10, 3, 11, 0)),
            (event_2, speaker_1, "Workshop xây dựng MVP trong một ngày", "Thực hành chuyển insight thành giả thuyết và prototype có thể kiểm thử.", datetime(2026, 10, 3, 13, 0), datetime(2026, 10, 3, 15, 30)),
            (event_3, speaker_3, "Báo cáo xu hướng công nghệ 2026", "Nhìn lại các xu hướng nổi bật và tác động đến doanh nghiệp Việt Nam.", datetime(2026, 7, 20, 9, 0), datetime(2026, 7, 20, 10, 30)),
            (event_3, speaker_1, "Networking và tổng kết", "Kết nối người tham dự và tổng kết các ý tưởng hợp tác.", datetime(2026, 7, 20, 13, 0), datetime(2026, 7, 20, 14, 30)),
        ]

        for event, speaker, title, description, start, end in sessions:
            get_or_create_session(
                db,
                event_id=event.SuKienId,
                speaker_id=speaker.DienGiaId,
                title=title,
                description=description,
                start=start,
                end=end,
                location=event.DiaDiem,
            )

        registrations = [
            (event_1, "Nguyễn An", "nguyenan@example.com", "0901000001", "REG-DEMO-001", "QR-DEMO-001", True, datetime(2026, 9, 15, 8, 15), "QR"),
            (event_1, "Lê Bình", "lebinh@example.com", "0901000002", "REG-DEMO-002", "QR-DEMO-002", False, None, None),
            (event_1, "Phạm Chi", "phamchi@example.com", "0901000003", "REG-DEMO-003", "QR-DEMO-003", True, datetime(2026, 9, 15, 8, 25), "MANUAL"),
            (event_2, "Đỗ Minh", "dominh@example.com", "0902000001", "REG-DEMO-004", "QR-DEMO-004", False, None, None),
            (event_2, "Vũ Lan", "vulan@example.com", "0902000002", "REG-DEMO-005", "QR-DEMO-005", True, datetime(2026, 10, 3, 8, 45), "QR"),
            (event_3, "Hoàng Sơn", "hoangson@example.com", "0903000001", "REG-DEMO-006", "QR-DEMO-006", True, datetime(2026, 7, 20, 7, 45), "QR"),
            (event_3, "Mai Trang", "maitrang@example.com", "0903000002", "REG-DEMO-007", "QR-DEMO-007", True, datetime(2026, 7, 20, 7, 50), "MANUAL"),
        ]

        registration_records = []
        for event, name, email, phone, code, qr, checked_in, check_in_time, check_in_method in registrations:
            registration_records.append(
                get_or_create_registration(
                    db,
                    event_id=event.SuKienId,
                    ho_ten=name,
                    email=email,
                    phone=phone,
                    registration_code=code,
                    qr_code=qr,
                    checked_in=checked_in,
                    check_in_time=check_in_time,
                    check_in_method=check_in_method,
                )
            )

        feedback_data = [
            (registration_records[0], 5, "Nội dung rất hữu ích và có tính thực tế.", datetime(2026, 9, 15, 18, 0)),
            (registration_records[2], 4, "Diễn giả trình bày dễ hiểu, phần demo rất trực quan.", datetime(2026, 9, 15, 18, 15)),
            (registration_records[4], 5, "Workshop thực tế và giúp tôi hiểu rõ cách làm MVP.", datetime(2026, 10, 3, 17, 30)),
            (registration_records[5], 4, "Không gian tốt, nội dung hữu ích và nhiều kết nối.", datetime(2026, 7, 20, 17, 0)),
            (registration_records[6], 5, "Chương trình được tổ chức chuyên nghiệp.", datetime(2026, 7, 20, 17, 10)),
        ]

        for registration, score, content, created_at in feedback_data:
            create_feedback_if_missing(
                db,
                registration_id=registration.DangKyId,
                score=score,
                content=content,
                created_at=created_at,
            )

        faq_data = [
            (event_1, "Sự kiện tổ chức ở đâu?", "Sự kiện diễn ra tại Hội trường A - Đại học Công nghệ."),
            (event_1, "Có cần mang theo mã QR không?", "Bạn nên mở mã QR đăng ký khi làm thủ tục check-in."),
            (event_2, "Bootcamp phù hợp với ai?", "Chương trình phù hợp với người mới làm sản phẩm và các nhóm startup."),
            (event_2, "Có hoạt động thực hành không?", "Có. Người tham dự sẽ làm workshop theo nhóm trong buổi chiều."),
            (event_3, "Sự kiện đã kết thúc chưa?", "Sự kiện đã kết thúc vào ngày 20/07/2026."),
            (event_3, "Có khu vực networking không?", "Có, khu vực networking mở từ 13:00 tại sảnh Riverside."),
        ]

        for event, question, answer in faq_data:
            create_faq_if_missing(
                db,
                event_id=event.SuKienId,
                question=question,
                answer=answer,
                created_at=datetime(2026, 8, 26, 10, 0),
            )

        notification_data = [
            (event_1, "Nhắc lịch: AI trong quản lý sự kiện hiện đại", "Sự kiện sẽ bắt đầu lúc 08:30 ngày 15/09/2026 tại Hội trường A - Đại học Công nghệ.", "NHAC_LICH"),
            (event_1, "Cập nhật sự kiện: AI trong quản lý sự kiện hiện đại", "Vui lòng có mặt trước 15 phút để hoàn tất thủ tục check-in.", "CAP_NHAT"),
            (event_2, "Nhắc lịch: Product Discovery Bootcamp", "Bootcamp sẽ bắt đầu lúc 09:00 ngày 03/10/2026 tại Innovate Hub - Tầng 5.", "NHAC_LICH"),
            (event_2, "Thông tin workshop buổi chiều", "Workshop xây dựng MVP bắt đầu lúc 13:00. Hãy chuẩn bị laptop cá nhân.", "CAP_NHAT"),
            (event_3, "Cảm ơn bạn đã tham gia Vietnam Tech Connect 2026", "Cảm ơn bạn đã đồng hành và đóng góp cho chương trình.", "CAM_ON"),
            (event_3, "Tổng kết Vietnam Tech Connect 2026", "Ban tổ chức đã hoàn tất chương trình và tổng hợp các ý tưởng hợp tác.", "CAP_NHAT"),
        ]

        for event, title, content, notification_type in notification_data:
            create_notification_if_missing(
                db,
                event_id=event.SuKienId,
                title=title,
                content=content,
                notification_type=notification_type,
                created_at=datetime(2026, 8, 26, 11, 0),
            )

        db.commit()
        print("Demo data seeded successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
