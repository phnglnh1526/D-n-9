from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# =========================================================
# 1. NGƯỜI DÙNG
# =========================================================

class NguoiDung(Base):
    __tablename__ = "NguoiDung"

    NguoiDungId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    HoTen: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    Email: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True
    )

    MatKhauHash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    VaiTro: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    NgayTao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    su_kiens: Mapped[list["SuKien"]] = relationship(
        back_populates="nguoi_to_chuc"
    )


# =========================================================
# 2. DIỄN GIẢ
# =========================================================

class DienGia(Base):
    __tablename__ = "DienGia"

    DienGiaId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    HoTen: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    ChucDanh: Mapped[str | None] = mapped_column(
        String(150)
    )

    DonVi: Mapped[str | None] = mapped_column(
        String(200)
    )

    GioiThieu: Mapped[str | None] = mapped_column(
        Text
    )

    phien_su_kiens: Mapped[list["PhienSuKien"]] = relationship(
        back_populates="dien_gia"
    )


# =========================================================
# 3. SỰ KIỆN
# =========================================================

class SuKien(Base):
    __tablename__ = "SuKien"

    SuKienId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    NguoiToChucId: Mapped[int] = mapped_column(
        ForeignKey("NguoiDung.NguoiDungId"),
        nullable=False
    )

    TenSuKien: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    MoTa: Mapped[str | None] = mapped_column(Text)

    ThoiGianBatDau: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    ThoiGianKetThuc: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    DiaDiem: Mapped[str | None] = mapped_column(
        String(255)
    )

    TrangThai: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    NgayTao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    nguoi_to_chuc: Mapped["NguoiDung"] = relationship(
        back_populates="su_kiens"
    )

    phien_su_kiens: Mapped[list["PhienSuKien"]] = relationship(
        back_populates="su_kien",
        cascade="all, delete",
        passive_deletes=True
    )

    dang_kys: Mapped[list["DangKy"]] = relationship(
        back_populates="su_kien",
        cascade="all, delete",
        passive_deletes=True
    )

    cau_hoi_thuong_gaps: Mapped[list["CauHoiThuongGap"]] = relationship(
        back_populates="su_kien",
        cascade="all, delete",
        passive_deletes=True
    )

    thong_baos: Mapped[list["ThongBao"]] = relationship(
        back_populates="su_kien",
        cascade="all, delete",
        passive_deletes=True
    )


# =========================================================
# 4. PHIÊN SỰ KIỆN
# =========================================================

class PhienSuKien(Base):
    __tablename__ = "PhienSuKien"

    PhienSuKienId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    SuKienId: Mapped[int] = mapped_column(
        ForeignKey("SuKien.SuKienId"),
        nullable=False
    )

    DienGiaId: Mapped[int | None] = mapped_column(
        ForeignKey("DienGia.DienGiaId")
    )

    TieuDe: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    MoTa: Mapped[str | None] = mapped_column(Text)

    ThoiGianBatDau: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    ThoiGianKetThuc: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    DiaDiem: Mapped[str | None] = mapped_column(
        String(255)
    )

    su_kien: Mapped["SuKien"] = relationship(
        back_populates="phien_su_kiens"
    )

    dien_gia: Mapped["DienGia | None"] = relationship(
        back_populates="phien_su_kiens"
    )


# =========================================================
# 5. ĐĂNG KÝ
# =========================================================

class DangKy(Base):
    __tablename__ = "DangKy"

    DangKyId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    SuKienId: Mapped[int] = mapped_column(
        ForeignKey("SuKien.SuKienId"),
        nullable=False
    )

    HoTen: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    Email: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    SoDienThoai: Mapped[str | None] = mapped_column(
        String(20)
    )

    MaDangKy: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )

    MaQR: Mapped[str | None] = mapped_column(
        String(255),
        unique=True
    )

    ThoiGianDangKy: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    TrangThai: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    DaCheckIn: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )

    ThoiGianCheckIn: Mapped[datetime | None] = mapped_column(
        DateTime
    )

    PhuongThucCheckIn: Mapped[str | None] = mapped_column(
        String(50)
    )

    su_kien: Mapped["SuKien"] = relationship(
        back_populates="dang_kys"
    )

    phan_hois: Mapped[list["PhanHoi"]] = relationship(
        back_populates="dang_ky",
        cascade="all, delete",
        passive_deletes=True
)


# =========================================================
# 6. PHẢN HỒI
# =========================================================

class PhanHoi(Base):
    __tablename__ = "PhanHoi"

    PhanHoiId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    DangKyId: Mapped[int] = mapped_column(
        ForeignKey("DangKy.DangKyId"),
        nullable=False
    )

    DiemDanhGia: Mapped[int | None] = mapped_column(
        Integer
    )

    NoiDung: Mapped[str | None] = mapped_column(
        Text
    )

    NgayTao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    dang_ky: Mapped["DangKy"] = relationship(
        back_populates="phan_hois"
    )


# =========================================================
# 7. CÂU HỎI THƯỜNG GẶP
# =========================================================

class CauHoiThuongGap(Base):
    __tablename__ = "CauHoiThuongGap"

    CauHoiThuongGapId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    SuKienId: Mapped[int] = mapped_column(
        ForeignKey("SuKien.SuKienId"),
        nullable=False
    )

    CauHoi: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    CauTraLoi: Mapped[str | None] = mapped_column(
        Text
    )

    NgayTao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    su_kien: Mapped["SuKien"] = relationship(
        back_populates="cau_hoi_thuong_gaps"
    )


# =========================================================
# 8. THÔNG BÁO
# =========================================================

class ThongBao(Base):
    __tablename__ = "ThongBao"

    ThongBaoId: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    SuKienId: Mapped[int] = mapped_column(
        ForeignKey("SuKien.SuKienId"),
        nullable=False
    )

    TieuDe: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    NoiDung: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    LoaiThongBao: Mapped[str | None] = mapped_column(
        String(50)
    )

    NgayTao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    ThoiGianGui: Mapped[datetime | None] = mapped_column(
        DateTime
    )

    su_kien: Mapped["SuKien"] = relationship(
        back_populates="thong_baos"
    )