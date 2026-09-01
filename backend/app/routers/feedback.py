from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from ..auth_service import (
    check_event_permission,
    get_current_user,
    require_roles,
)
from ..database import get_db
from ..models import (
    CauHoiThuongGap,
    DangKy,
    NguoiDung,
    PhanHoi,
    SuKien,
)
from ..schemas import (
    CauHoiThuongGapCreate,
    CauHoiThuongGapResponse,
    PhanHoiCreate,
    PhanHoiResponse,
)


router = APIRouter(
    tags=["Feedback & FAQ"]
)


# =========================================================
# 1. GỬI PHẢN HỒI THEO SỰ KIỆN (ATTENDEE)
# =========================================================

@router.post(
    "/events/{event_id}/feedback",
    response_model=PhanHoiResponse,
    status_code=status.HTTP_201_CREATED
)
def create_event_feedback(
    event_id: int,
    data: PhanHoiCreate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_user)
):
    event = db.query(SuKien).filter(SuKien.SuKienId == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện")

    if data.DiemDanhGia < 1 or data.DiemDanhGia > 5:
        raise HTTPException(status_code=400, detail="Điểm đánh giá phải từ 1 đến 5 sao")

    # Tìm đăng ký của người dùng cho sự kiện này
    registration = (
        db.query(DangKy)
        .filter(
            DangKy.SuKienId == event_id,
            (DangKy.NguoiDungId == current_user.NguoiDungId)
            | (DangKy.Email == current_user.Email)
        )
        .first()
    )

    if registration is None:
        raise HTTPException(
            status_code=400,
            detail="Bạn chưa đăng ký tham gia sự kiện này nên không thể gửi phản hồi"
        )

    existing_feedback = (
        db.query(PhanHoi)
        .filter(PhanHoi.DangKyId == registration.DangKyId)
        .first()
    )

    if existing_feedback is not None:
        raise HTTPException(
            status_code=409,
            detail="Bạn đã gửi phản hồi cho sự kiện này rồi"
        )

    feedback = PhanHoi(
        DangKyId=registration.DangKyId,
        DiemDanhGia=data.DiemDanhGia,
        NoiDung=data.NoiDung.strip() if data.NoiDung else None,
        NgayTao=datetime.now()
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "PhanHoiId": feedback.PhanHoiId,
        "DangKyId": feedback.DangKyId,
        "DiemDanhGia": feedback.DiemDanhGia,
        "NoiDung": feedback.NoiDung,
        "NgayTao": feedback.NgayTao,
        "HoTen": registration.HoTen,
        "Email": registration.Email
    }


# =========================================================
# 1.1 GỬI PHẢN HỒI THEO MÃ ĐĂNG KÝ
# =========================================================

@router.post(
    "/registrations/{registration_id}/feedback",
    response_model=PhanHoiResponse,
    status_code=status.HTTP_201_CREATED
)
def create_feedback(
    registration_id: int,
    data: PhanHoiCreate,
    db: Session = Depends(get_db)
):
    # Tìm đăng ký
    registration = (
        db.query(DangKy)
        .filter(
            DangKy.DangKyId == registration_id
        )
        .first()
    )

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy đăng ký"
        )

    # Điểm phải từ 1 đến 5
    if (
        data.DiemDanhGia < 1
        or data.DiemDanhGia > 5
    ):
        raise HTTPException(
            status_code=400,
            detail="Điểm đánh giá phải từ 1 đến 5 sao"
        )

    # Một đăng ký chỉ feedback một lần
    existing_feedback = (
        db.query(PhanHoi)
        .filter(
            PhanHoi.DangKyId == registration_id
        )
        .first()
    )

    if existing_feedback is not None:
        raise HTTPException(
            status_code=409,
            detail="Đăng ký này đã gửi phản hồi"
        )

    feedback = PhanHoi(
        DangKyId=registration_id,
        DiemDanhGia=data.DiemDanhGia,
        NoiDung=data.NoiDung.strip() if data.NoiDung else None,
        NgayTao=datetime.now()
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "PhanHoiId": feedback.PhanHoiId,
        "DangKyId": feedback.DangKyId,
        "DiemDanhGia": feedback.DiemDanhGia,
        "NoiDung": feedback.NoiDung,
        "NgayTao": feedback.NgayTao,
        "HoTen": registration.HoTen,
        "Email": registration.Email
    }


# =========================================================
# 2. XEM PHẢN HỒI CỦA SỰ KIỆN
# ADMIN / ORGANIZER
# =========================================================

@router.get(
    "/events/{event_id}/feedback",
    response_model=list[PhanHoiResponse]
)
def get_event_feedback(
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

    feedbacks_with_attendees = (
        db.query(
            PhanHoi.PhanHoiId,
            PhanHoi.DangKyId,
            PhanHoi.DiemDanhGia,
            PhanHoi.NoiDung,
            PhanHoi.NgayTao,
            DangKy.HoTen,
            DangKy.Email
        )
        .join(
            DangKy,
            PhanHoi.DangKyId == DangKy.DangKyId
        )
        .filter(
            DangKy.SuKienId == event_id
        )
        .order_by(
            PhanHoi.NgayTao.desc()
        )
        .all()
    )

    return [
        {
            "PhanHoiId": row.PhanHoiId,
            "DangKyId": row.DangKyId,
            "DiemDanhGia": row.DiemDanhGia,
            "NoiDung": row.NoiDung,
            "NgayTao": row.NgayTao,
            "HoTen": row.HoTen,
            "Email": row.Email,
        }
        for row in feedbacks_with_attendees
    ]


# =========================================================
# 3. THÊM FAQ
# ADMIN / ORGANIZER
# =========================================================

@router.post(
    "/events/{event_id}/faqs",
    response_model=CauHoiThuongGapResponse,
    status_code=status.HTTP_201_CREATED
)
def create_faq(
    event_id: int,
    data: CauHoiThuongGapCreate,
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

    faq = CauHoiThuongGap(
        SuKienId=event_id,
        CauHoi=data.CauHoi,
        CauTraLoi=data.CauTraLoi,
        NgayTao=datetime.now()
    )

    db.add(faq)
    db.commit()
    db.refresh(faq)

    return faq


# =========================================================
# 4. XEM FAQ
# PUBLIC
# =========================================================

@router.get(
    "/events/{event_id}/faqs",
    response_model=list[CauHoiThuongGapResponse]
)
def get_event_faqs(
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

    faqs = (
        db.query(CauHoiThuongGap)
        .filter(
            CauHoiThuongGap.SuKienId == event_id
        )
        .order_by(
            CauHoiThuongGap.NgayTao.desc()
        )
        .all()
    )

    return faqs