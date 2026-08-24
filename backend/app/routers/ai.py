from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from ..ai_service import (
    answer_event_question,
    generate_event_notification,
    summarize_feedback,
)
from ..auth_service import (
    check_event_permission,
    require_roles,
)
from ..database import get_db
from ..models import (
    CauHoiThuongGap,
    DangKy,
    NguoiDung,
    PhanHoi,
    SuKien,
    ThongBao,
)
from ..schemas import (
    AIPhanHoiSummaryResponse,
    ChatRequest,
    ChatResponse,
    ThongBaoAIRequest,
    ThongBaoResponse,
)


router = APIRouter(
    prefix="/events",
    tags=["AI & Notifications"]
)


# =========================================================
# 1. AI TÓM TẮT PHẢN HỒI
# ADMIN / ORGANIZER
# =========================================================

@router.get(
    "/{event_id}/ai/feedback-summary",
    response_model=AIPhanHoiSummaryResponse
)
def ai_feedback_summary(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER"
        )
    )
):
    # Kiểm tra sự kiện
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

    # ORGANIZER chỉ được xem AI
    # của sự kiện do mình tổ chức
    check_event_permission(
        event,
        current_user
    )

    # Lấy phản hồi
    feedbacks = (
        db.query(PhanHoi)
        .join(
            DangKy,
            PhanHoi.DangKyId
            == DangKy.DangKyId
        )
        .filter(
            DangKy.SuKienId == event_id
        )
        .all()
    )

    if not feedbacks:
        raise HTTPException(
            status_code=400,
            detail=(
                "Sự kiện chưa có phản hồi "
                "để phân tích"
            )
        )

    # Điểm đánh giá
    scores = [
        feedback.DiemDanhGia
        for feedback in feedbacks
        if feedback.DiemDanhGia is not None
    ]

    if scores:
        average_score = (
            sum(scores) / len(scores)
        )
    else:
        average_score = 0

    # Nội dung phản hồi
    feedback_texts = [
        feedback.NoiDung
        for feedback in feedbacks
        if feedback.NoiDung
    ]

    # AI / MOCK
    ai_summary = summarize_feedback(
        event_name=event.TenSuKien,
        average_score=average_score,
        feedback_texts=feedback_texts
    )

    return {
        "SuKienId": event.SuKienId,
        "TenSuKien": event.TenSuKien,
        "TongSoPhanHoi": len(feedbacks),
        "DiemTrungBinh": round(
            average_score,
            2
        ),
        "TomTatAI": ai_summary
    }


# =========================================================
# 2. CHATBOT HỎI ĐÁP SỰ KIỆN
# PUBLIC
# =========================================================

@router.post(
    "/{event_id}/ai/chat",
    response_model=ChatResponse
)
def event_chat(
    event_id: int,
    data: ChatRequest,
    db: Session = Depends(get_db)
):
    # Tìm sự kiện
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

    # Lấy FAQ của sự kiện
    faq_records = (
        db.query(CauHoiThuongGap)
        .filter(
            CauHoiThuongGap.SuKienId
            == event_id
        )
        .all()
    )

    faqs = [
        {
            "CauHoi": faq.CauHoi,
            "CauTraLoi": faq.CauTraLoi
        }
        for faq in faq_records
    ]

    answer, source = (
        answer_event_question(
            event_name=event.TenSuKien,
            event_location=event.DiaDiem,
            event_start=event.ThoiGianBatDau,
            event_end=event.ThoiGianKetThuc,
            question=data.CauHoi,
            faqs=faqs
        )
    )

    return {
        "SuKienId": event_id,
        "CauHoi": data.CauHoi,
        "CauTraLoi": answer,
        "Nguon": source
    }


# =========================================================
# 3. AI SINH THÔNG BÁO
# ADMIN / ORGANIZER
# =========================================================

@router.post(
    "/{event_id}/ai/notifications",
    response_model=ThongBaoResponse,
    status_code=status.HTTP_201_CREATED
)
def create_ai_notification(
    event_id: int,
    data: ThongBaoAIRequest,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(
        require_roles(
            "ADMIN",
            "ORGANIZER"
        )
    )
):
    # Tìm sự kiện
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

    notification_type = (
        data.LoaiThongBao
        .strip()
        .upper()
    )

    allowed_types = {
        "NHAC_LICH",
        "CAP_NHAT",
        "CAM_ON",
    }

    if notification_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Loại thông báo phải là "
                "NHAC_LICH, CAP_NHAT hoặc CAM_ON"
            )
        )

    # Sinh nội dung bằng AI / MOCK
    title, content = (
        generate_event_notification(
            event_name=event.TenSuKien,
            event_location=event.DiaDiem,
            event_start=event.ThoiGianBatDau,
            event_end=event.ThoiGianKetThuc,
            notification_type=notification_type
        )
    )

    notification = ThongBao(
        SuKienId=event_id,
        TieuDe=title,
        NoiDung=content,
        LoaiThongBao=notification_type,
        NgayTao=datetime.now(),
        ThoiGianGui=None
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# =========================================================
# 4. XEM THÔNG BÁO CỦA SỰ KIỆN
# PUBLIC
# =========================================================

@router.get(
    "/{event_id}/notifications",
    response_model=list[ThongBaoResponse]
)
def get_event_notifications(
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

    notifications = (
        db.query(ThongBao)
        .filter(
            ThongBao.SuKienId == event_id
        )
        .order_by(
            ThongBao.NgayTao.desc()
        )
        .all()
    )

    return notifications