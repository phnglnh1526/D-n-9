from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth_service import (
    check_event_permission,
    require_roles,
)
from ..database import get_db
from ..models import (
    CheckIn,
    DangKy,
    NguoiDung,
    PhanHoi,
    SuKien,
)
from ..schemas import (
    SuKienCreate,
    SuKienResponse,
    SuKienUpdate,
    ThongKeSuKienResponse,
    ThongKeTongQuanResponse,
)


router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


# =========================================================
# 1. DANH SÁCH SỰ KIỆN
# Public
# =========================================================

@router.get(
    "",
    response_model=list[SuKienResponse]
)
def get_events(
    organizer_id: int | None = None,
    trang_thai: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(SuKien)

    if organizer_id:
        query = query.filter(SuKien.NguoiToChucId == organizer_id)

    if trang_thai:
        query = query.filter(SuKien.TrangThai == trang_thai.upper())

    events = query.order_by(SuKien.ThoiGianBatDau.desc()).all()
    return events


# =========================================================
# 2. TẠO SỰ KIỆN
# ADMIN / ORGANIZER
# =========================================================

@router.post(
    "",
    response_model=SuKienResponse,
    status_code=status.HTTP_201_CREATED
)
def create_event(
    data: SuKienCreate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER"
        )
    )
):
    # Validation: Tên sự kiện không được để trống
    ten_su_kien = data.TenSuKien.strip()
    if not ten_su_kien:
        raise HTTPException(
            status_code=400,
            detail="Tên sự kiện không được để trống"
        )

    # Validation: Số lượng tối đa phải > 0
    if data.SoLuongToiDa is not None and data.SoLuongToiDa <= 0:
        raise HTTPException(
            status_code=400,
            detail="Số lượng khách tối đa phải lớn hơn 0"
        )

    # ORGANIZER chỉ được tạo sự kiện thuộc chính mình
    if current_user.VaiTro == "ORGANIZER":
        organizer_id = current_user.NguoiDungId

    else:
        organizer_id = data.NguoiToChucId

        organizer = (
            db.query(NguoiDung)
            .filter(
                NguoiDung.NguoiDungId
                == organizer_id
            )
            .first()
        )

        if organizer is None:
            raise HTTPException(
                status_code=404,
                detail="Người tổ chức không tồn tại"
            )

    # Validation: Thời gian kết thúc phải sau thời gian bắt đầu
    if (
        data.ThoiGianKetThuc
        <= data.ThoiGianBatDau
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Thời gian kết thúc phải "
                "sau thời gian bắt đầu"
            )
        )

    new_event = SuKien(
        NguoiToChucId=organizer_id,
        TenSuKien=ten_su_kien,
        MoTa=data.MoTa,
        ThoiGianBatDau=data.ThoiGianBatDau,
        ThoiGianKetThuc=data.ThoiGianKetThuc,
        DiaDiem=data.DiaDiem,
        SoLuongToiDa=data.SoLuongToiDa,
        TrangThai="NHAP",
        NgayTao=datetime.now()
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


# =========================================================
# 3. CHI TIẾT SỰ KIỆN
# Public
# =========================================================

@router.get(
    "/{event_id}",
    response_model=SuKienResponse
)
def get_event_by_id(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = (
        db.query(SuKien)
        .filter(
            SuKien.SuKienId == event_id
        )
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy sự kiện"
        )

    return event


# =========================================================
# 4. CẬP NHẬT SỰ KIỆN
# ADMIN / ORGANIZER sở hữu sự kiện
# =========================================================

@router.put(
    "/{event_id}",
    response_model=SuKienResponse
)
def update_event(
    event_id: int,
    data: SuKienUpdate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER"
        )
    )
):
    event = (
        db.query(SuKien)
        .filter(
            SuKien.SuKienId == event_id
        )
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy sự kiện"
        )

    # ADMIN được sửa tất cả,
    # ORGANIZER chỉ event của mình
    check_event_permission(
        event,
        current_user
    )

    # Validation: Tên sự kiện không được để trống
    ten_su_kien = data.TenSuKien.strip()
    if not ten_su_kien:
        raise HTTPException(
            status_code=400,
            detail="Tên sự kiện không được để trống"
        )

    # Validation: Số lượng tối đa phải > 0
    if data.SoLuongToiDa is not None and data.SoLuongToiDa <= 0:
        raise HTTPException(
            status_code=400,
            detail="Số lượng khách tối đa phải lớn hơn 0"
        )

    # Validation: Thời gian kết thúc phải sau thời gian bắt đầu
    if (
        data.ThoiGianKetThuc
        <= data.ThoiGianBatDau
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Thời gian kết thúc phải "
                "sau thời gian bắt đầu"
            )
        )

    # ADMIN có thể đổi organizer
    if current_user.VaiTro == "ADMIN":

        organizer = (
            db.query(NguoiDung)
            .filter(
                NguoiDung.NguoiDungId
                == data.NguoiToChucId
            )
            .first()
        )

        if organizer is None:
            raise HTTPException(
                status_code=404,
                detail="Người tổ chức không tồn tại"
            )

        event.NguoiToChucId = (
            data.NguoiToChucId
        )

    else:
        # ORGANIZER không được chuyển
        # event sang tài khoản khác
        event.NguoiToChucId = (
            current_user.NguoiDungId
        )

    event.TenSuKien = ten_su_kien
    event.MoTa = data.MoTa

    event.ThoiGianBatDau = (
        data.ThoiGianBatDau
    )

    event.ThoiGianKetThuc = (
        data.ThoiGianKetThuc
    )

    event.DiaDiem = data.DiaDiem
    event.SoLuongToiDa = data.SoLuongToiDa
    event.TrangThai = data.TrangThai

    db.commit()
    db.refresh(event)

    return event


# =========================================================
# 5. XÓA SỰ KIỆN
# ADMIN / ORGANIZER sở hữu sự kiện
# =========================================================

@router.delete(
    "/{event_id}"
)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER"
        )
    )
):
    event = (
        db.query(SuKien)
        .filter(
            SuKien.SuKienId == event_id
        )
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy sự kiện"
        )

    check_event_permission(
        event,
        current_user
    )

    db.delete(event)
    db.commit()

    return {
        "message": "Xóa sự kiện thành công",
        "SuKienId": event_id
    }


# =========================================================
# 6. THỐNG KÊ TỔNG QUAN DASHBOARD
# ADMIN / ORGANIZER
# =========================================================

@router.get(
    "/statistics/overview",
    response_model=ThongKeTongQuanResponse
)
def get_dashboard_overview_statistics(
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER"
        )
    )
):
    # Lấy danh sách sự kiện theo quyền
    if current_user.VaiTro == "ADMIN":
        events_query = db.query(SuKien)
    else:
        events_query = db.query(SuKien).filter(SuKien.NguoiToChucId == current_user.NguoiDungId)

    events = events_query.all()
    event_ids = [e.SuKienId for e in events]

    total_events = len(events)

    # Thống kê theo trạng thái
    status_counts = {
        "DA_DUYET": 0,
        "DANG_DIEN_RA": 0,
        "KET_THUC": 0,
        "NHAP": 0,
    }
    for e in events:
        st = e.TrangThai or "NHAP"
        status_counts[st] = status_counts.get(st, 0) + 1

    if not event_ids:
        return {
            "TongSoSuKien": 0,
            "TongDangKy": 0,
            "TongCheckIn": 0,
            "TyLeThamDu": 0.0,
            "TongPhanHoi": 0,
            "DiemTrungBinh": 0.0,
            "SuKienTheoTrangThai": status_counts,
        }

    # 1. Tổng đăng ký
    total_registrations = (
        db.query(func.count(DangKy.DangKyId))
        .filter(DangKy.SuKienId.in_(event_ids))
        .scalar()
        or 0
    )

    # 2. Tổng check-in (từ bảng CheckIn hoặc DangKy.DaCheckIn)
    total_checkin = (
        db.query(func.count(CheckIn.CheckInId))
        .join(DangKy, CheckIn.DangKyId == DangKy.DangKyId)
        .filter(DangKy.SuKienId.in_(event_ids))
        .scalar()
        or 0
    )

    if total_checkin == 0:
        total_checkin = (
            db.query(func.count(DangKy.DangKyId))
            .filter(
                DangKy.SuKienId.in_(event_ids),
                DangKy.DaCheckIn.is_(True)
            )
            .scalar()
            or 0
        )

    # 3. Tỷ lệ tham dự = Tổng check-in / Tổng đăng ký * 100
    if total_registrations > 0:
        attendance_rate = round((total_checkin / total_registrations) * 100, 2)
    else:
        attendance_rate = 0.0

    # 4. Tổng phản hồi & điểm trung bình
    total_feedback = (
        db.query(func.count(PhanHoi.PhanHoiId))
        .join(DangKy, PhanHoi.DangKyId == DangKy.DangKyId)
        .filter(DangKy.SuKienId.in_(event_ids))
        .scalar()
        or 0
    )

    avg_score = (
        db.query(func.avg(PhanHoi.DiemDanhGia))
        .join(DangKy, PhanHoi.DangKyId == DangKy.DangKyId)
        .filter(DangKy.SuKienId.in_(event_ids))
        .scalar()
    )

    return {
        "TongSoSuKien": total_events,
        "TongDangKy": total_registrations,
        "TongCheckIn": total_checkin,
        "TyLeThamDu": attendance_rate,
        "TongPhanHoi": total_feedback,
        "DiemTrungBinh": round(float(avg_score), 2) if avg_score is not None else 0.0,
        "SuKienTheoTrangThai": status_counts,
    }


# =========================================================
# 7. THỐNG KÊ CHI TIẾT 1 SỰ KIỆN CỤ THỂ
# ADMIN / ORGANIZER sở hữu sự kiện
# =========================================================

@router.get(
    "/{event_id}/statistics",
    response_model=ThongKeSuKienResponse
)
def get_event_statistics(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER"
        )
    )
):
    event = (
        db.query(SuKien)
        .filter(
            SuKien.SuKienId == event_id
        )
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy sự kiện"
        )

    check_event_permission(
        event,
        current_user
    )

    # Tổng đăng ký
    tong_dang_ky = (
        db.query(
            func.count(DangKy.DangKyId)
        )
        .filter(
            DangKy.SuKienId == event_id
        )
        .scalar()
        or 0
    )

    # Đã check-in (từ bảng CheckIn hoặc cột DaCheckIn)
    da_check_in = (
        db.query(func.count(CheckIn.CheckInId))
        .join(DangKy, CheckIn.DangKyId == DangKy.DangKyId)
        .filter(DangKy.SuKienId == event_id)
        .scalar()
        or 0
    )

    if da_check_in == 0:
        da_check_in = (
            db.query(
                func.count(DangKy.DangKyId)
            )
            .filter(
                DangKy.SuKienId == event_id,
                DangKy.DaCheckIn.is_(True)
            )
            .scalar()
            or 0
        )

    chua_check_in = (
        tong_dang_ky - da_check_in
    )

    # Tỷ lệ check-in = da_check_in / tong_dang_ky * 100
    if tong_dang_ky > 0:
        ty_le_check_in = (
            da_check_in
            / tong_dang_ky
            * 100
        )
    else:
        ty_le_check_in = 0

    # Tổng phản hồi
    tong_phan_hoi = (
        db.query(
            func.count(PhanHoi.PhanHoiId)
        )
        .join(
            DangKy,
            PhanHoi.DangKyId
            == DangKy.DangKyId
        )
        .filter(
            DangKy.SuKienId == event_id
        )
        .scalar()
        or 0
    )

    # Điểm trung bình
    diem_trung_binh = (
        db.query(
            func.avg(PhanHoi.DiemDanhGia)
        )
        .join(
            DangKy,
            PhanHoi.DangKyId
            == DangKy.DangKyId
        )
        .filter(
            DangKy.SuKienId == event_id
        )
        .scalar()
    )

    if diem_trung_binh is None:
        diem_trung_binh = 0

    return {
        "SuKienId": event.SuKienId,
        "TenSuKien": event.TenSuKien,
        "TongDangKy": tong_dang_ky,
        "DaCheckIn": da_check_in,
        "ChuaCheckIn": chua_check_in,
        "TyLeCheckIn": round(
            ty_le_check_in,
            2
        ),
        "TongPhanHoi": tong_phan_hoi,
        "DiemTrungBinh": round(
            float(diem_trung_binh),
            2
        )
    }