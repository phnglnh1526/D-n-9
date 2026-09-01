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
    get_current_user,
    require_roles,
)
from ..database import get_db
from ..models import (
    CheckIn,
    DangKy,
    NguoiDung,
    SuKien,
)
from ..schemas import (
    CheckInLookupResponse,
    CheckInRequest,
    DangKyCreate,
    DangKyResponse,
)


router = APIRouter(
    tags=["Registrations"]
)


# =========================================================
# 1. ĐĂNG KÝ THAM GIA SỰ KIỆN
# ATTENDEE / AUTHENTICATED USER
# =========================================================

@router.post(
    "/events/{event_id}/registrations",
    response_model=DangKyResponse,
    status_code=status.HTTP_201_CREATED
)
def create_registration(
    event_id: int,
    data: DangKyCreate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_user)
):
    # 1. Kiểm tra sự kiện tồn tại
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

    # 2. Rule: Sự kiện có mở đăng ký không?
    if event.TrangThai not in ["DA_DUYET", "DANG_DIEN_RA"]:
        raise HTTPException(
            status_code=400,
            detail=f"Sự kiện hiện không mở đăng ký (trạng thái: {event.TrangThai})"
        )

    # Lấy thông tin họ tên & email
    ho_ten = (data.HoTen or "").strip() or current_user.HoTen
    email = (data.Email or "").strip().lower() or current_user.Email.lower()
    so_dien_thoai = data.SoDienThoai.strip() if data.SoDienThoai else None

    # 3. Rule: Kiểm tra không đăng ký trùng cùng 1 sự kiện
    existing_registration = (
        db.query(DangKy)
        .filter(
            DangKy.SuKienId == event_id,
            (DangKy.NguoiDungId == current_user.NguoiDungId) | (DangKy.Email == email)
        )
        .first()
    )

    if existing_registration is not None:
        raise HTTPException(
            status_code=409,
            detail="Bạn đã đăng ký tham gia sự kiện này rồi"
        )

    # 4. Rule: Kiểm tra số lượng khách tối đa (không vượt quá SoLuongToiDa)
    if event.SoLuongToiDa is not None:
        total_registered = (
            db.query(DangKy)
            .filter(DangKy.SuKienId == event_id)
            .count()
        )
        if total_registered >= event.SoLuongToiDa:
            raise HTTPException(
                status_code=400,
                detail="Sự kiện đã đạt số lượng khách đăng ký tối đa"
            )

    # 5. Sinh mã đăng ký & QR Token
    ma_dang_ky = (
        f"REG-{uuid4().hex[:10].upper()}"
    )

    ma_qr = (
        f"QR-{uuid4().hex.upper()}"
    )

    # 6. Tạo bản ghi DangKy gắn đúng NguoiDungId và SuKienId
    registration = DangKy(
        SuKienId=event_id,
        NguoiDungId=current_user.NguoiDungId,
        HoTen=ho_ten,
        Email=email,
        SoDienThoai=so_dien_thoai,

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
# 1.1 LẤY DANH SÁCH VÉ / ĐĂNG KÝ CỦA TÔI (ATTENDEE)
# =========================================================

@router.get(
    "/users/me/registrations",
    response_model=list[DangKyResponse]
)
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_user)
):
    registrations = (
        db.query(DangKy)
        .filter(
            (DangKy.NguoiDungId == current_user.NguoiDungId)
            | (DangKy.Email == current_user.Email)
        )
        .order_by(DangKy.ThoiGianDangKy.desc())
        .all()
    )
    return registrations


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
# =========================================================
# 3. TRA CỨU ĐĂNG KÝ TRƯỚC KHI CHECK-IN
# ADMIN / ORGANIZER / STAFF
# =========================================================

@router.get(
    "/check-in/lookup/{code}",
    response_model=CheckInLookupResponse
)
def lookup_for_checkin(
    code: str,
    event_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles("ADMIN", "ORGANIZER", "STAFF")
    )
):
    code_clean = code.strip()

    # Tìm đăng ký theo Mã đăng ký hoặc Mã QR
    registration = (
        db.query(DangKy)
        .filter(
            (DangKy.MaDangKy == code_clean)
            | (DangKy.MaQR == code_clean)
        )
        .first()
    )

    # Case 2: Mã không tồn tại
    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Mã đăng ký hoặc mã QR không tồn tại trong hệ thống"
        )

    # Case 6: Sai sự kiện
    if event_id and registration.SuKienId != event_id:
        raise HTTPException(
            status_code=400,
            detail=f"Vé này thuộc sự kiện #{registration.SuKienId}, không khớp với sự kiện bạn đang chọn check-in"
        )

    # Case 3: Đăng ký đã bị hủy
    if registration.TrangThai == "DA_HUY":
        raise HTTPException(
            status_code=400,
            detail="Vé tham dự này đã bị hủy, không thể check-in"
        )

    # Lấy tên sự kiện
    event = db.query(SuKien).filter(SuKien.SuKienId == registration.SuKienId).first()
    ten_su_kien = event.TenSuKien if event else None

    # Lấy thông tin nhân viên check-in nếu đã check-in
    nhan_vien_id = None
    if registration.check_in_record:
        nhan_vien_id = registration.check_in_record.NhanVienId

    return {
        "DangKyId": registration.DangKyId,
        "SuKienId": registration.SuKienId,
        "TenSuKien": ten_su_kien,
        "NguoiDungId": registration.NguoiDungId,
        "HoTen": registration.HoTen,
        "Email": registration.Email,
        "SoDienThoai": registration.SoDienThoai,
        "MaDangKy": registration.MaDangKy,
        "MaQR": registration.MaQR,
        "TrangThai": registration.TrangThai,
        "DaCheckIn": registration.DaCheckIn,
        "ThoiGianCheckIn": registration.ThoiGianCheckIn,
        "PhuongThucCheckIn": registration.PhuongThucCheckIn,
        "NhanVienId": nhan_vien_id,
    }


# =========================================================
# 3.1 XÁC NHẬN CHECK-IN
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
    # 1. Tìm bản ghi đăng ký
    registration = (
        db.query(DangKy)
        .filter(
            DangKy.DangKyId == registration_id
        )
        .first()
    )

    # Case 2: Mã không tồn tại
    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thông tin đăng ký"
        )

    # Case 6: Kiểm tra đúng sự kiện nếu có truyền SuKienId
    if data.SuKienId and registration.SuKienId != data.SuKienId:
        raise HTTPException(
            status_code=400,
            detail=f"Vé này thuộc sự kiện #{registration.SuKienId}, không khớp với sự kiện bạn đang chọn check-in"
        )

    # Case 3: Đăng ký đã bị hủy
    if registration.TrangThai == "DA_HUY":
        raise HTTPException(
            status_code=400,
            detail="Vé tham dự này đã bị hủy, không thể check-in"
        )

    # Kiểm tra phân quyền: ORGANIZER chỉ check-in cho sự kiện của mình
    if current_user.VaiTro == "ORGANIZER":
        event = (
            db.query(SuKien)
            .filter(
                SuKien.SuKienId == registration.SuKienId
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

    # Case 4 & 5: Kiểm tra người dùng đã check-in / Check-in lần thứ hai
    if registration.DaCheckIn:
        thoi_gian_str = (
            registration.ThoiGianCheckIn.strftime("%H:%M:%S %d/%m/%Y")
            if registration.ThoiGianCheckIn
            else "trước đó"
        )
        raise HTTPException(
            status_code=409,
            detail=f"Người tham dự đã check-in vào lúc {thoi_gian_str}. Không thể check-in lần thứ hai."
        )

    # Kiểm tra mã QR nếu check-in bằng phương thức QR
    if data.PhuongThucCheckIn == "QR":
        if not data.MaQR:
            raise HTTPException(
                status_code=400,
                detail="Vui lòng cung cấp mã QR"
            )

        if data.MaQR.strip() != (registration.MaQR or "").strip():
            raise HTTPException(
                status_code=400,
                detail="Mã QR không hợp lệ hoặc không khớp với vé đăng ký"
            )

    thoi_gian_hien_tai = datetime.now()

    # 1. Cập nhật bản ghi DangKy
    registration.DaCheckIn = True
    registration.ThoiGianCheckIn = thoi_gian_hien_tai
    registration.PhuongThucCheckIn = data.PhuongThucCheckIn

    # 2. Tạo bản ghi CheckIn lưu vào bảng CheckIn
    checkin_record = CheckIn(
        DangKyId=registration.DangKyId,
        NhanVienId=current_user.NguoiDungId,
        ThoiGianCheckIn=thoi_gian_hien_tai,
        PhuongThucCheckIn=data.PhuongThucCheckIn,
        TrangThai="THANH_CONG"
    )

    try:
        db.add(checkin_record)
        db.commit()
        db.refresh(registration)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Bản ghi check-in đã tồn tại trong hệ thống"
        )

    return registration


# =========================================================
# 4. CHI TIẾT ĐĂNG KÝ / VÉ THAM DỰ
# PUBLIC / ATTENDEE
# =========================================================

@router.get(
    "/registrations/{registration_id}",
    response_model=DangKyResponse
)
def get_registration_by_id(
    registration_id: int,
    db: Session = Depends(get_db)
):
    registration = (
        db.query(DangKy)
        .filter(DangKy.DangKyId == registration_id)
        .first()
    )

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thông tin đăng ký"
        )

    return registration


# =========================================================
# 5. TRA CỨU VÉ BẰNG MÃ ĐĂNG KÝ HOẶC MÃ QR
# PUBLIC / STAFF
# =========================================================

@router.get(
    "/registrations/ticket/{code}",
    response_model=DangKyResponse
)
def get_ticket_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    code_clean = code.strip()

    registration = (
        db.query(DangKy)
        .filter(
            (DangKy.MaDangKy == code_clean)
            | (DangKy.MaQR == code_clean)
        )
        .first()
    )

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy vé tương ứng với mã cung cấp"
        )

    return registration