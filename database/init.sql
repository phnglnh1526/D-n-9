CREATE DATABASE IF NOT EXISTS event_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

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

    SoLuongToiDa INT NULL DEFAULT NULL,

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

    NguoiDungId INT NULL,

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
        ON DELETE CASCADE,

    CONSTRAINT FK_DangKy_NguoiDung
        FOREIGN KEY (NguoiDungId)
        REFERENCES NguoiDung(NguoiDungId)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- =========================================================
-- 6. CHECK-IN SỰ KIỆN
-- =========================================================

CREATE TABLE CheckIn (
    CheckInId INT AUTO_INCREMENT PRIMARY KEY,

    DangKyId INT NOT NULL,

    NhanVienId INT NOT NULL,

    ThoiGianCheckIn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PhuongThucCheckIn VARCHAR(50) NOT NULL DEFAULT 'MANUAL',

    TrangThai VARCHAR(50) NOT NULL DEFAULT 'THANH_CONG',

    CONSTRAINT FK_CheckIn_DangKy
        FOREIGN KEY (DangKyId)
        REFERENCES DangKy(DangKyId)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT FK_CheckIn_NhanVien
        FOREIGN KEY (NhanVienId)
        REFERENCES NguoiDung(NguoiDungId)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT UQ_CheckIn_DangKy
        UNIQUE (DangKyId)
);


-- =========================================================
-- 7. PHẢN HỒI
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
-- 9. DỮ LIỆU KHỞI TẠO MẶC ĐỊNH (SEED ADMIN)
-- =========================================================

INSERT IGNORE INTO NguoiDung (NguoiDungId, HoTen, Email, MatKhauHash, VaiTro, NgayTao)
VALUES (
    1,
    'Admin Quản Trị',
    'admin@test.com',
    '$argon2id$v=19$m=65536,t=3,p=4$isdgtfz2LGsGcoDV0xLCuw$WOZWkuVs4JtfjBjcyIrm8P79/V473zSJcqg2u6NMSNc',
    'ADMIN',
    NOW()
);