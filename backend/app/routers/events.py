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
    DangKy,
    NguoiDung,
    PhanHoi,
    SuKien,
)
from ..statistics_service import get_attendance_metrics
from ..schemas import (
    SuKienCreate,
    SuKienResponse,
    SuKienUpdate,
    ThongKeSuKienResponse,
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
    db: Session = Depends(get_db)
):
    events = db.query(SuKien).all()

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

    # Kiểm tra thời gian
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
        TenSuKien=data.TenSuKien,
        MoTa=data.MoTa,
        ThoiGianBatDau=data.ThoiGianBatDau,
        ThoiGianKetThuc=data.ThoiGianKetThuc,
        DiaDiem=data.DiaDiem,
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

    event.TenSuKien = data.TenSuKien
    event.MoTa = data.MoTa

    event.ThoiGianBatDau = (
        data.ThoiGianBatDau
    )

    event.ThoiGianKetThuc = (
        data.ThoiGianKetThuc
    )

    event.DiaDiem = data.DiaDiem
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
# 6. THỐNG KÊ SỰ KIỆN
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

    attendance = get_attendance_metrics(
        db,
        event_id,
    )

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
        **attendance,
        "TongPhanHoi": tong_phan_hoi,
        "DiemTrungBinh": round(
            float(diem_trung_binh),
            2
        )
    }