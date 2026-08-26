-- =========================================================
-- HỆ THỐNG QUẢN LÝ SỰ KIỆN TÍCH HỢP AI
-- Database: event_management
-- =========================================================

USE event_management;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;


-- =========================================================
-- 1. NGƯỜI DÙNG
-- =========================================================

CREATE TABLE NguoiDung (
    NguoiDungId INT AUTO_INCREMENT PRIMARY KEY,

    HoTen VARCHAR(100) NOT NULL,

    Email VARCHAR(150) NOT NULL UNIQUE,

    MatKhauHash VARCHAR(255) NOT NULL,

    VaiTro VARCHAR(30) NOT NULL,

    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. DIỄN GIẢ
-- =========================================================

CREATE TABLE DienGia (
    DienGiaId INT AUTO_INCREMENT PRIMARY KEY,

    HoTen VARCHAR(100) NOT NULL,

    ChucDanh VARCHAR(150),

    DonVi VARCHAR(200),

    GioiThieu TEXT
);


-- =========================================================
-- 3. SỰ KIỆN
-- =========================================================

CREATE TABLE SuKien (
    SuKienId INT AUTO_INCREMENT PRIMARY KEY,

    NguoiToChucId INT NOT NULL,

    TenSuKien VARCHAR(200) NOT NULL,

    MoTa TEXT,

    ThoiGianBatDau DATETIME NOT NULL,

    ThoiGianKetThuc DATETIME NOT NULL,

    DiaDiem VARCHAR(255),

    TrangThai VARCHAR(30) NOT NULL DEFAULT 'NHAP',

    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_SuKien_NguoiDung
        FOREIGN KEY (NguoiToChucId)
        REFERENCES NguoiDung(NguoiDungId)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- =========================================================
-- 4. PHIÊN SỰ KIỆN / LỊCH TRÌNH
-- =========================================================

CREATE TABLE PhienSuKien (
    PhienSuKienId INT AUTO_INCREMENT PRIMARY KEY,

    SuKienId INT NOT NULL,

    DienGiaId INT,

    TieuDe VARCHAR(200) NOT NULL,

    MoTa TEXT,

    ThoiGianBatDau DATETIME NOT NULL,

    ThoiGianKetThuc DATETIME NOT NULL,

    DiaDiem VARCHAR(255),

    CONSTRAINT FK_PhienSuKien_SuKien
        FOREIGN KEY (SuKienId)
        REFERENCES SuKien(SuKienId)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT FK_PhienSuKien_DienGia
        FOREIGN KEY (DienGiaId)
        REFERENCES DienGia(DienGiaId)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- =========================================================
-- 5. ĐĂNG KÝ THAM GIA
-- =========================================================

CREATE TABLE DangKy (
    DangKyId INT AUTO_INCREMENT PRIMARY KEY,

    SuKienId INT NOT NULL,

    HoTen VARCHAR(100) NOT NULL,

    Email VARCHAR(150) NOT NULL,

    SoDienThoai VARCHAR(20),

    MaDangKy VARCHAR(100) NOT NULL UNIQUE,

    MaQR VARCHAR(255) UNIQUE,

    ThoiGianDangKy DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    TrangThai VARCHAR(30) NOT NULL DEFAULT 'DA_DANG_KY',

    DaCheckIn BOOLEAN NOT NULL DEFAULT FALSE,

    ThoiGianCheckIn DATETIME NULL,

    PhuongThucCheckIn VARCHAR(50),

    CONSTRAINT UQ_DangKy_SuKien_Email
        UNIQUE (SuKienId, Email),

    CONSTRAINT FK_DangKy_SuKien
        FOREIGN KEY (SuKienId)
        REFERENCES SuKien(SuKienId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 6. PHẢN HỒI
-- =========================================================

CREATE TABLE PhanHoi (
    PhanHoiId INT AUTO_INCREMENT PRIMARY KEY,

    DangKyId INT NOT NULL,

    DiemDanhGia INT,

    NoiDung TEXT,

    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_PhanHoi_DangKy
        FOREIGN KEY (DangKyId)
        REFERENCES DangKy(DangKyId)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT CK_PhanHoi_DiemDanhGia
        CHECK (DiemDanhGia IS NULL OR DiemDanhGia BETWEEN 1 AND 5)
);


-- =========================================================
-- 7. CÂU HỎI THƯỜNG GẶP
-- =========================================================

CREATE TABLE CauHoiThuongGap (
    CauHoiThuongGapId INT AUTO_INCREMENT PRIMARY KEY,

    SuKienId INT NOT NULL,

    CauHoi TEXT NOT NULL,

    CauTraLoi TEXT,

    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_CauHoiThuongGap_SuKien
        FOREIGN KEY (SuKienId)
        REFERENCES SuKien(SuKienId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 8. THÔNG BÁO
-- =========================================================

CREATE TABLE ThongBao (
    ThongBaoId INT AUTO_INCREMENT PRIMARY KEY,

    SuKienId INT NOT NULL,

    TieuDe VARCHAR(200) NOT NULL,

    NoiDung TEXT NOT NULL,

    LoaiThongBao VARCHAR(50),

    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ThoiGianGui DATETIME NULL,

    CONSTRAINT FK_ThongBao_SuKien
        FOREIGN KEY (SuKienId)
        REFERENCES SuKien(SuKienId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- DỮ LIỆU DEMO
-- =========================================================

-- Mật khẩu demo cho các tài khoản: Admin@123
INSERT IGNORE INTO NguoiDung
    (NguoiDungId, HoTen, Email, MatKhauHash, VaiTro, NgayTao)
VALUES
    (1, 'Admin Demo', 'admin@test.com', '$argon2id$v=19$m=65536,t=3,p=4$m0I3WorLq72l5DQD4Umv0w$J8OwhmGSivwjH/rOG3rvAkGeYDtGc5tyOvH4U9tkkGs', 'ADMIN', '2026-08-26 08:00:00'),
    (2, 'Nguyễn Minh Anh', 'organizer@test.com', '$argon2id$v=19$m=65536,t=3,p=4$m0I3WorLq72l5DQD4Umv0w$J8OwhmGSivwjH/rOG3rvAkGeYDtGc5tyOvH4U9tkkGs', 'ORGANIZER', '2026-08-26 08:00:00'),
    (3, 'Trần Quốc Bảo', 'staff@test.com', '$argon2id$v=19$m=65536,t=3,p=4$m0I3WorLq72l5DQD4Umv0w$J8OwhmGSivwjH/rOG3rvAkGeYDtGc5tyOvH4U9tkkGs', 'STAFF', '2026-08-26 08:00:00');

INSERT IGNORE INTO DienGia
    (DienGiaId, HoTen, ChucDanh, DonVi, GioiThieu)
VALUES
    (1, 'Lê Minh Khôi', 'Chuyên gia chuyển đổi số', 'FutureLab Vietnam', 'Tư vấn chiến lược dữ liệu và tự động hóa cho doanh nghiệp.'),
    (2, 'Phạm Thu Hà', 'Product Lead', 'Innovate Hub', 'Hơn 10 năm xây dựng sản phẩm số lấy người dùng làm trung tâm.'),
    (3, 'Ngô Hoàng Nam', 'Giảng viên công nghệ', 'Đại học Công nghệ', 'Nghiên cứu AI ứng dụng và hệ thống thông tin doanh nghiệp.');

INSERT IGNORE INTO SuKien
    (SuKienId, NguoiToChucId, TenSuKien, MoTa, ThoiGianBatDau, ThoiGianKetThuc, DiaDiem, TrangThai, NgayTao)
VALUES
    (1, 2, 'AI trong quản lý sự kiện hiện đại', 'Khám phá cách AI hỗ trợ lập kế hoạch, vận hành và đo lường trải nghiệm người tham dự.', '2026-09-15 08:30:00', '2026-09-15 17:00:00', 'Hội trường A - Đại học Công nghệ', 'DA_DUYET', '2026-08-26 08:30:00'),
    (2, 2, 'Product Discovery Bootcamp', 'Một ngày thực hành khám phá vấn đề, phỏng vấn người dùng và xây dựng MVP.', '2026-10-03 09:00:00', '2026-10-03 16:30:00', 'Innovate Hub - Tầng 5', 'DA_DUYET', '2026-08-26 08:30:00'),
    (3, 1, 'Vietnam Tech Connect 2026', 'Không gian kết nối cộng đồng công nghệ, chia sẻ xu hướng và mở rộng hợp tác.', '2026-07-20 08:00:00', '2026-07-20 15:00:00', 'Trung tâm hội nghị Riverside', 'DA_KET_THUC', '2026-08-26 08:30:00');

INSERT IGNORE INTO PhienSuKien
    (PhienSuKienId, SuKienId, DienGiaId, TieuDe, MoTa, ThoiGianBatDau, ThoiGianKetThuc, DiaDiem)
VALUES
    (1, 1, 1, 'Khai mạc và xu hướng AI trong vận hành sự kiện', 'Tổng quan các cơ hội ứng dụng AI trong toàn bộ vòng đời sự kiện.', '2026-09-15 09:00:00', '2026-09-15 10:00:00', 'Hội trường A - Đại học Công nghệ'),
    (2, 1, 2, 'Thiết kế trải nghiệm người tham dự bằng dữ liệu', 'Dùng dữ liệu để cá nhân hóa hành trình trước, trong và sau sự kiện.', '2026-09-15 10:30:00', '2026-09-15 11:30:00', 'Hội trường A - Đại học Công nghệ'),
    (3, 1, 3, 'Panel: Từ đăng ký đến check-in thông minh', 'Thảo luận thực tế về tự động hóa đăng ký, QR và phân tích phản hồi.', '2026-09-15 14:00:00', '2026-09-15 15:30:00', 'Hội trường A - Đại học Công nghệ'),
    (4, 2, 2, 'Tư duy sản phẩm cho người mới', 'Các nguyên tắc nền tảng để xác định đúng vấn đề cần giải quyết.', '2026-10-03 09:30:00', '2026-10-03 11:00:00', 'Innovate Hub - Tầng 5'),
    (5, 2, 1, 'Workshop xây dựng MVP trong một ngày', 'Thực hành chuyển insight thành giả thuyết và prototype có thể kiểm thử.', '2026-10-03 13:00:00', '2026-10-03 15:30:00', 'Innovate Hub - Tầng 5'),
    (6, 3, 3, 'Báo cáo xu hướng công nghệ 2026', 'Nhìn lại các xu hướng nổi bật và tác động đến doanh nghiệp Việt Nam.', '2026-07-20 09:00:00', '2026-07-20 10:30:00', 'Trung tâm hội nghị Riverside'),
    (7, 3, 1, 'Networking và tổng kết', 'Kết nối người tham dự và tổng kết các ý tưởng hợp tác.', '2026-07-20 13:00:00', '2026-07-20 14:30:00', 'Trung tâm hội nghị Riverside');

INSERT IGNORE INTO DangKy
    (DangKyId, SuKienId, HoTen, Email, SoDienThoai, MaDangKy, MaQR, ThoiGianDangKy, TrangThai, DaCheckIn, ThoiGianCheckIn, PhuongThucCheckIn)
VALUES
    (1, 1, 'Nguyễn An', 'nguyenan@example.com', '0901000001', 'REG-DEMO-001', 'QR-DEMO-001', '2026-08-27 09:00:00', 'DA_DANG_KY', TRUE, '2026-09-15 08:15:00', 'QR'),
    (2, 1, 'Lê Bình', 'lebinh@example.com', '0901000002', 'REG-DEMO-002', 'QR-DEMO-002', '2026-08-27 09:00:00', 'DA_DANG_KY', FALSE, NULL, NULL),
    (3, 1, 'Phạm Chi', 'phamchi@example.com', '0901000003', 'REG-DEMO-003', 'QR-DEMO-003', '2026-08-27 09:00:00', 'DA_DANG_KY', TRUE, '2026-09-15 08:25:00', 'MANUAL'),
    (4, 2, 'Đỗ Minh', 'dominh@example.com', '0902000001', 'REG-DEMO-004', 'QR-DEMO-004', '2026-08-27 09:00:00', 'DA_DANG_KY', FALSE, NULL, NULL),
    (5, 2, 'Vũ Lan', 'vulan@example.com', '0902000002', 'REG-DEMO-005', 'QR-DEMO-005', '2026-08-27 09:00:00', 'DA_DANG_KY', TRUE, '2026-10-03 08:45:00', 'QR'),
    (6, 3, 'Hoàng Sơn', 'hoangson@example.com', '0903000001', 'REG-DEMO-006', 'QR-DEMO-006', '2026-08-27 09:00:00', 'DA_DANG_KY', TRUE, '2026-07-20 07:45:00', 'QR'),
    (7, 3, 'Mai Trang', 'maitrang@example.com', '0903000002', 'REG-DEMO-007', 'QR-DEMO-007', '2026-08-27 09:00:00', 'DA_DANG_KY', TRUE, '2026-07-20 07:50:00', 'MANUAL');

INSERT IGNORE INTO PhanHoi
    (PhanHoiId, DangKyId, DiemDanhGia, NoiDung, NgayTao)
VALUES
    (1, 1, 5, 'Nội dung rất hữu ích và có tính thực tế.', '2026-09-15 18:00:00'),
    (2, 3, 4, 'Diễn giả trình bày dễ hiểu, phần demo rất trực quan.', '2026-09-15 18:15:00'),
    (3, 5, 5, 'Workshop thực tế và giúp tôi hiểu rõ cách làm MVP.', '2026-10-03 17:30:00'),
    (4, 6, 4, 'Không gian tốt, nội dung hữu ích và nhiều kết nối.', '2026-07-20 17:00:00'),
    (5, 7, 5, 'Chương trình được tổ chức chuyên nghiệp.', '2026-07-20 17:10:00');

INSERT IGNORE INTO CauHoiThuongGap
    (CauHoiThuongGapId, SuKienId, CauHoi, CauTraLoi, NgayTao)
VALUES
    (1, 1, 'Sự kiện tổ chức ở đâu?', 'Sự kiện diễn ra tại Hội trường A - Đại học Công nghệ.', '2026-08-26 10:00:00'),
    (2, 1, 'Có cần mang theo mã QR không?', 'Bạn nên mở mã QR đăng ký khi làm thủ tục check-in.', '2026-08-26 10:00:00'),
    (3, 2, 'Bootcamp phù hợp với ai?', 'Chương trình phù hợp với người mới làm sản phẩm và các nhóm startup.', '2026-08-26 10:00:00'),
    (4, 2, 'Có hoạt động thực hành không?', 'Có. Người tham dự sẽ làm workshop theo nhóm trong buổi chiều.', '2026-08-26 10:00:00'),
    (5, 3, 'Sự kiện đã kết thúc chưa?', 'Sự kiện đã kết thúc vào ngày 20/07/2026.', '2026-08-26 10:00:00'),
    (6, 3, 'Có khu vực networking không?', 'Có, khu vực networking mở từ 13:00 tại sảnh Riverside.', '2026-08-26 10:00:00');

INSERT IGNORE INTO ThongBao
    (ThongBaoId, SuKienId, TieuDe, NoiDung, LoaiThongBao, NgayTao, ThoiGianGui)
VALUES
    (1, 1, 'Nhắc lịch: AI trong quản lý sự kiện hiện đại', 'Sự kiện sẽ bắt đầu lúc 08:30 ngày 15/09/2026 tại Hội trường A - Đại học Công nghệ.', 'NHAC_LICH', '2026-08-26 11:00:00', NULL),
    (2, 1, 'Cập nhật sự kiện: AI trong quản lý sự kiện hiện đại', 'Vui lòng có mặt trước 15 phút để hoàn tất thủ tục check-in.', 'CAP_NHAT', '2026-08-26 11:00:00', NULL),
    (3, 2, 'Nhắc lịch: Product Discovery Bootcamp', 'Bootcamp sẽ bắt đầu lúc 09:00 ngày 03/10/2026 tại Innovate Hub - Tầng 5.', 'NHAC_LICH', '2026-08-26 11:00:00', NULL),
    (4, 2, 'Thông tin workshop buổi chiều', 'Workshop xây dựng MVP bắt đầu lúc 13:00. Hãy chuẩn bị laptop cá nhân.', 'CAP_NHAT', '2026-08-26 11:00:00', NULL),
    (5, 3, 'Cảm ơn bạn đã tham gia Vietnam Tech Connect 2026', 'Cảm ơn bạn đã đồng hành và đóng góp cho chương trình.', 'CAM_ON', '2026-08-26 11:00:00', NULL),
    (6, 3, 'Tổng kết Vietnam Tech Connect 2026', 'Ban tổ chức đã hoàn tất chương trình và tổng hợp các ý tưởng hợp tác.', 'CAP_NHAT', '2026-08-26 11:00:00', NULL);
