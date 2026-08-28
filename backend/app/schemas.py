from typing import Literal
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# DỮ LIỆU DÙNG KHI TẠO SỰ KIỆN
# =========================================================

from pydantic import BaseModel, ConfigDict, field_validator


class SuKienCreate(BaseModel):
    NguoiToChucId: int
    TenSuKien: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None
    SoLuongToiDa: int | None = None

    @field_validator("TenSuKien")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Tên sự kiện không được để trống")
        return v.strip()

    @field_validator("SoLuongToiDa")
    @classmethod
    def validate_capacity(cls, v: int | None) -> int | None:
        if v is not None and v <= 0:
            raise ValueError("Số lượng khách tối đa phải lớn hơn 0")
        return v


class SuKienUpdate(BaseModel):
    NguoiToChucId: int
    TenSuKien: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None
    SoLuongToiDa: int | None = None
    TrangThai: str

    @field_validator("TenSuKien")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Tên sự kiện không được để trống")
        return v.strip()

    @field_validator("SoLuongToiDa")
    @classmethod
    def validate_capacity(cls, v: int | None) -> int | None:
        if v is not None and v <= 0:
            raise ValueError("Số lượng khách tối đa phải lớn hơn 0")
        return v


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
    SoLuongToiDa: int | None = None
    TrangThai: str
    NgayTao: datetime

    model_config = ConfigDict(from_attributes=True)
# =========================================================
# ĐĂNG KÝ THAM GIA SỰ KIỆN
# =========================================================

class DangKyCreate(BaseModel):
    HoTen: str | None = None
    Email: str | None = None
    SoDienThoai: str | None = None


class DangKyResponse(BaseModel):
    DangKyId: int
    SuKienId: int
    NguoiDungId: int | None = None
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

class CheckInRecordResponse(BaseModel):
    CheckInId: int
    DangKyId: int
    NhanVienId: int
    ThoiGianCheckIn: datetime
    PhuongThucCheckIn: str
    TrangThai: str

    model_config = ConfigDict(from_attributes=True)


class CheckInLookupResponse(BaseModel):
    DangKyId: int
    SuKienId: int
    TenSuKien: str | None = None
    NguoiDungId: int | None = None
    HoTen: str
    Email: str
    SoDienThoai: str | None = None
    MaDangKy: str
    MaQR: str | None = None
    TrangThai: str
    DaCheckIn: bool
    ThoiGianCheckIn: datetime | None = None
    PhuongThucCheckIn: str | None = None
    NhanVienId: int | None = None

    model_config = ConfigDict(from_attributes=True)


class CheckInRequest(BaseModel):
    SuKienId: int | None = None
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
    HoTen: str | None = None
    Email: str | None = None

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
    message: str | None = None
    CauHoi: str | None = None
    event_id: int | None = None
    SuKienId: int | None = None


class ChatResponse(BaseModel):
    message: str
    response: str
    event_id: int | None = None
    source: str = "DATABASE_AI"
    SuKienId: int | None = None
    CauHoi: str | None = None
    CauTraLoi: str | None = None
    Nguon: str | None = None
# =========================================================
# THÔNG BÁO
# =========================================================

class ThongBaoAIRequest(BaseModel):
    LoaiThongBao: str = "NHAC_LICH"
    GhiChu: str | None = None
    DiaDiemMoi: str | None = None


class ThongBaoAIPreviewResponse(BaseModel):
    TieuDe: str
    NoiDung: str
    LoaiThongBao: str


class ThongBaoCreateRequest(BaseModel):
    TieuDe: str
    NoiDung: str
    LoaiThongBao: str | None = "NHAC_LICH"


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
# THỐNG KÊ SỰ KIỆN & TỔNG QUAN DASHBOARD
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


class ThongKeTongQuanResponse(BaseModel):
    TongSoSuKien: int
    TongDangKy: int
    TongCheckIn: int
    TyLeThamDu: float
    TongPhanHoi: int
    DiemTrungBinh: float
    SuKienTheoTrangThai: dict[str, int]
# =========================================================
# AUTHENTICATION
# =========================================================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class NguoiDungCreate(BaseModel):
    HoTen: str
    Email: str
    MatKhau: str
    VaiTro: str = "ORGANIZER"


class NguoiDungResponse(BaseModel):
    NguoiDungId: int
    HoTen: str
    Email: str
    VaiTro: str
    NgayTao: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# DIỄN GIẢ - SPEAKER
# =========================================================

class DienGiaCreate(BaseModel):
    HoTen: str
    ChucDanh: str | None = None
    DonVi: str | None = None
    GioiThieu: str | None = None


class DienGiaResponse(BaseModel):
    DienGiaId: int
    HoTen: str
    ChucDanh: str | None = None
    DonVi: str | None = None
    GioiThieu: str | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# PHIÊN SỰ KIỆN / LỊCH TRÌNH - SCHEDULE / SESSION
# =========================================================

class PhienSuKienCreate(BaseModel):
    SuKienId: int
    DienGiaId: int | None = None
    TieuDe: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None


class PhienSuKienUpdate(BaseModel):
    DienGiaId: int | None = None
    TieuDe: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None


class PhienSuKienResponse(BaseModel):
    PhienSuKienId: int
    SuKienId: int
    DienGiaId: int | None = None
    TieuDe: str
    MoTa: str | None = None
    ThoiGianBatDau: datetime
    ThoiGianKetThuc: datetime
    DiaDiem: str | None = None
    dien_gia: DienGiaResponse | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# AI ATTENDANCE INSIGHT SCHEMAS
# =========================================================

class EventStatsInput(BaseModel):
    id: int | None = None
    name: str | None = None
    status: str | None = None
    registrations: int = 0
    checkIns: int = 0
    unchecked: int = 0
    attendanceRate: float = 0.0


class ComparisonItemInput(BaseModel):
    eventId: int | None = None
    eventName: str
    registrations: int = 0
    checkIns: int = 0
    attendanceRate: float = 0.0


class CodeCalculationsInput(BaseModel):
    comparisonAverage: float | None = None
    differenceFromAverage: float | None = None
    rankingPosition: int | None = None
    numberOfComparedEvents: int = 0


class AttendanceInsightRequest(BaseModel):
    context: Literal["all_events", "single_event"]
    event: EventStatsInput | None = None
    comparison: list[ComparisonItemInput] = []
    calculations: CodeCalculationsInput | None = None

class AttendanceInsightResponse(BaseModel):
    summary: str
    findings: list[str]
    recommendations: list[str]
    source: str = "MOCK"