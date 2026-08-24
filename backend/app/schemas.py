from typing import Literal
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# DỮ LIỆU DÙNG KHI TẠO SỰ KIỆN
# =========================================================

class SuKienCreate(BaseModel):
    NguoiToChucId: int
    TenSuKien: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None

class SuKienUpdate(BaseModel):
    NguoiToChucId: int
    TenSuKien: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None
    TrangThai: str
# =========================================================
# DỮ LIỆU API TRẢ VỀ
# =========================================================

class SuKienResponse(BaseModel):
    SuKienId: int
    NguoiToChucId: int
    TenSuKien: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None
    TrangThai: str
    NgayTao: datetime

    model_config = ConfigDict(from_attributes=True)
# =========================================================
# ĐĂNG KÝ THAM GIA SỰ KIỆN
# =========================================================

class DangKyCreate(BaseModel):
    HoTen: str
    Email: str
    SoDienThoai: str | None = None


class DangKyResponse(BaseModel):
    DangKyId: int
    SuKienId: int
    HoTen: str
    Email: str
    SoDienThoai: str | None = None

    MaDangKy: str
    MaQR: str | None = None

    ThoiGianDangKy: datetime
    TrangThai: str

    DaCheckIn: bool
    ThoiGianCheckIn: datetime | None = None
    PhuongThucCheckIn: str | None = None

    model_config = ConfigDict(from_attributes=True)
# =========================================================
# CHECK-IN
# =========================================================

class CheckInRequest(BaseModel):
    PhuongThucCheckIn: Literal["MANUAL", "QR"] = "MANUAL"
    MaQR: str | None = None
# =========================================================
# PHẢN HỒI
# =========================================================

class PhanHoiCreate(BaseModel):
    DiemDanhGia: int
    NoiDung: str | None = None


class PhanHoiResponse(BaseModel):
    PhanHoiId: int
    DangKyId: int
    DiemDanhGia: int | None = None
    NoiDung: str | None = None
    NgayTao: datetime

    model_config = ConfigDict(from_attributes=True)
# =========================================================
# AI - TÓM TẮT PHẢN HỒI
# =========================================================

class AIPhanHoiSummaryResponse(BaseModel):
    SuKienId: int
    TenSuKien: str
    TongSoPhanHoi: int
    DiemTrungBinh: float
    TomTatAI: str
# =========================================================
# CÂU HỎI THƯỜNG GẶP - FAQ
# =========================================================

class CauHoiThuongGapCreate(BaseModel):
    CauHoi: str
    CauTraLoi: str


class CauHoiThuongGapResponse(BaseModel):
    CauHoiThuongGapId: int
    SuKienId: int
    CauHoi: str
    CauTraLoi: str | None = None
    NgayTao: datetime

    model_config = ConfigDict(from_attributes=True)
# =========================================================
# CHATBOT SỰ KIỆN
# =========================================================

class ChatRequest(BaseModel):
    CauHoi: str


class ChatResponse(BaseModel):
    SuKienId: int
    CauHoi: str
    CauTraLoi: str
    Nguon: str
# =========================================================
# THÔNG BÁO
# =========================================================

class ThongBaoAIRequest(BaseModel):
    LoaiThongBao: str = "NHAC_LICH"


class ThongBaoResponse(BaseModel):
    ThongBaoId: int
    SuKienId: int
    TieuDe: str
    NoiDung: str
    LoaiThongBao: str | None = None
    NgayTao: datetime
    ThoiGianGui: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
# =========================================================
# THỐNG KÊ SỰ KIỆN
# =========================================================

class ThongKeSuKienResponse(BaseModel):
    SuKienId: int
    TenSuKien: str

    TongDangKy: int
    DaCheckIn: int
    ChuaCheckIn: int

    TyLeCheckIn: float

    TongPhanHoi: int
    DiemTrungBinh: float
# =========================================================
# AUTHENTICATION
# =========================================================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class NguoiDungResponse(BaseModel):
    NguoiDungId: int
    HoTen: str
    Email: str
    VaiTro: str
    NgayTao: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
