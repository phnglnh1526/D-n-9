from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth_service import check_event_permission, require_roles
from ..database import get_db
from ..models import DienGia, NguoiDung, PhienSuKien, SuKien
from ..schemas import PhienSuKienCreate, PhienSuKienResponse, PhienSuKienUpdate

router = APIRouter(
    tags=["Schedules & Sessions"]
)


# =========================================================
# 1. DANH SÁCH PHIÊN / LỊCH TRÌNH CỦA SỰ KIỆN (PUBLIC)
# =========================================================

@router.get("/events/{event_id}/sessions", response_model=list[PhienSuKienResponse])
def get_event_sessions(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(SuKien).filter(SuKien.SuKienId == event_id).first()
    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy sự kiện"
        )

    sessions = (
        db.query(PhienSuKien)
        .filter(PhienSuKien.SuKienId == event_id)
        .order_by(PhienSuKien.ThoiGianBatDau.asc())
        .all()
    )

    return sessions


# =========================================================
# 2. TẠO PHIÊN SỰ KIỆN (ADMIN / ORGANIZER SỞ HỮU)
# =========================================================

@router.post(
    "/events/{event_id}/sessions",
    response_model=PhienSuKienResponse,
    status_code=status.HTTP_201_CREATED
)
def create_event_session(
    event_id: int,
    data: PhienSuKienCreate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN", "ORGANIZER"))
):
    event = db.query(SuKien).filter(SuKien.SuKienId == event_id).first()
    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy sự kiện"
        )

    check_event_permission(event, current_user)

    if data.ThoiGianKetThuc <= data.ThoiGianBatDau:
        raise HTTPException(
            status_code=400,
            detail="Thời gian kết thúc phiên phải sau thời gian bắt đầu"
        )

    if data.DienGiaId:
        speaker = db.query(DienGia).filter(DienGia.DienGiaId == data.DienGiaId).first()
        if speaker is None:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy diễn giả"
            )

    session_item = PhienSuKien(
        SuKienId=event_id,
        DienGiaId=data.DienGiaId,
        TieuDe=data.TieuDe,
        MoTa=data.MoTa,
        ThoiGianBatDau=data.ThoiGianBatDau,
        ThoiGianKetThuc=data.ThoiGianKetThuc,
        DiaDiem=data.DiaDiem
    )

    db.add(session_item)
    db.commit()
    db.refresh(session_item)

    return session_item


# =========================================================
# 3. CẬP NHẬT PHIÊN SỰ KIỆN (ADMIN / ORGANIZER)
# =========================================================

@router.put("/sessions/{session_id}", response_model=PhienSuKienResponse)
def update_event_session(
    session_id: int,
    data: PhienSuKienUpdate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN", "ORGANIZER"))
):
    session_item = db.query(PhienSuKien).filter(PhienSuKien.PhienSuKienId == session_id).first()
    if session_item is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy phiên sự kiện"
        )

    event = db.query(SuKien).filter(SuKien.SuKienId == session_item.SuKienId).first()
    check_event_permission(event, current_user)

    if data.ThoiGianKetThuc <= data.ThoiGianBatDau:
        raise HTTPException(
            status_code=400,
            detail="Thời gian kết thúc phiên phải sau thời gian bắt đầu"
        )

    if data.DienGiaId:
        speaker = db.query(DienGia).filter(DienGia.DienGiaId == data.DienGiaId).first()
        if speaker is None:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy diễn giả"
            )

    session_item.DienGiaId = data.DienGiaId
    session_item.TieuDe = data.TieuDe
    session_item.MoTa = data.MoTa
    session_item.ThoiGianBatDau = data.ThoiGianBatDau
    session_item.ThoiGianKetThuc = data.ThoiGianKetThuc
    session_item.DiaDiem = data.DiaDiem

    db.commit()
    db.refresh(session_item)

    return session_item


# =========================================================
# 4. XÓA PHIÊN SỰ KIỆN (ADMIN / ORGANIZER)
# =========================================================

@router.delete("/sessions/{session_id}")
def delete_event_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN", "ORGANIZER"))
):
    session_item = db.query(PhienSuKien).filter(PhienSuKien.PhienSuKienId == session_id).first()
    if session_item is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy phiên sự kiện"
        )

    event = db.query(SuKien).filter(SuKien.SuKienId == session_item.SuKienId).first()
    check_event_permission(event, current_user)

    db.delete(session_item)
    db.commit()

    return {
        "message": "Xóa phiên sự kiện thành công",
        "PhienSuKienId": session_id
    }
