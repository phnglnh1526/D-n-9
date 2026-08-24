from datetime import datetime
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth_service import (
    check_event_permission,
    require_roles,
)
from ..database import get_db
from ..models import (
    DangKy,
    NguoiDung,
    SuKien,
)
from ..schemas import (
    CheckInRequest,
    DangKyCreate,
    DangKyResponse,
)


router = APIRouter(
    tags=["Registrations"]
)


# =========================================================
# 1. ĐĂNG KÝ THAM GIA SỰ KIỆN
# PUBLIC
# =========================================================

@router.post(
    "/events/{event_id}/registrations",
    response_model=DangKyResponse,
    status_code=status.HTTP_201_CREATED
)
def create_registration(
    event_id: int,
    data: DangKyCreate,
    db: Session = Depends(get_db)
):
    # Kiểm tra sự kiện tồn tại
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

    # Kiểm tra email đã đăng ký sự kiện này chưa
    existing_registration = (
        db.query(DangKy)
        .filter(
            DangKy.SuKienId == event_id,
            DangKy.Email == data.Email
        )
        .first()
    )

    if existing_registration is not None:
        raise HTTPException(
            status_code=409,
            detail="Email này đã đăng ký sự kiện"
        )

    # Sinh mã đăng ký
    ma_dang_ky = (
        f"REG-{uuid4().hex[:10].upper()}"
    )

    # Token dùng làm dữ liệu QR
    ma_qr = (
        f"QR-{uuid4().hex.upper()}"
    )

    registration = DangKy(
        SuKienId=event_id,
        HoTen=data.HoTen,
        Email=data.Email,
        SoDienThoai=data.SoDienThoai,

        MaDangKy=ma_dang_ky,
        MaQR=ma_qr,

        ThoiGianDangKy=datetime.now(),
        TrangThai="DA_DANG_KY",

        DaCheckIn=False,
        ThoiGianCheckIn=None,
        PhuongThucCheckIn=None
    )

    try:
        db.add(registration)
        db.commit()
        db.refresh(registration)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Thông tin đăng ký bị trùng"
        )

    return registration


# =========================================================
# 2. DANH SÁCH NGƯỜI ĐĂNG KÝ
# ADMIN / ORGANIZER / STAFF
# =========================================================

@router.get(
    "/events/{event_id}/registrations",
    response_model=list[DangKyResponse]
)
def get_event_registrations(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER",
            "STAFF"
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

    # ORGANIZER chỉ xem đăng ký
    # của sự kiện do mình tổ chức
    if current_user.VaiTro == "ORGANIZER":
        check_event_permission(
            event,
            current_user
        )

    registrations = (
        db.query(DangKy)
        .filter(
            DangKy.SuKienId == event_id
        )
        .order_by(
            DangKy.ThoiGianDangKy.desc()
        )
        .all()
    )

    return registrations


# =========================================================
# 3. CHECK-IN
# ADMIN / ORGANIZER / STAFF
# =========================================================

@router.post(
    "/registrations/{registration_id}/check-in",
    response_model=DangKyResponse
)
def check_in_registration(
    registration_id: int,
    data: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER",
            "STAFF"
        )
    )
):
    # Tìm đăng ký
    registration = (
        db.query(DangKy)
        .filter(
            DangKy.DangKyId
            == registration_id
        )
        .first()
    )

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy đăng ký"
        )

    # Nếu ORGANIZER thì chỉ được
    # check-in cho sự kiện của mình
    if current_user.VaiTro == "ORGANIZER":

        event = (
            db.query(SuKien)
            .filter(
                SuKien.SuKienId
                == registration.SuKienId
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

    # Không cho check-in hai lần
    if registration.DaCheckIn:
        raise HTTPException(
            status_code=409,
            detail="Người tham dự đã check-in"
        )

    # Nếu dùng QR thì kiểm tra mã
    if data.PhuongThucCheckIn == "QR":

        if not data.MaQR:
            raise HTTPException(
                status_code=400,
                detail="Vui lòng cung cấp mã QR"
            )

        if data.MaQR != registration.MaQR:
            raise HTTPException(
                status_code=400,
                detail="Mã QR không hợp lệ"
            )

    registration.DaCheckIn = True

    registration.ThoiGianCheckIn = (
        datetime.now()
    )

    registration.PhuongThucCheckIn = (
        data.PhuongThucCheckIn
    )

    db.commit()
    db.refresh(registration)

    return registration