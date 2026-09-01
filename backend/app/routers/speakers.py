from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth_service import require_roles
from ..database import get_db
from ..models import DienGia, NguoiDung
from ..schemas import DienGiaCreate, DienGiaResponse

router = APIRouter(
    prefix="/speakers",
    tags=["Speakers"]
)


# =========================================================
# 1. DANH SÁCH DIỄN GIẢ (PUBLIC)
# =========================================================

@router.get("", response_model=list[DienGiaResponse])
def get_speakers(
    db: Session = Depends(get_db)
):
    speakers = db.query(DienGia).all()
    return speakers


# =========================================================
# 2. TẠO DIỄN GIẢ (ADMIN / ORGANIZER)
# =========================================================

@router.post("", response_model=DienGiaResponse, status_code=status.HTTP_201_CREATED)
def create_speaker(
    data: DienGiaCreate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN", "ORGANIZER"))
):
    new_speaker = DienGia(
        HoTen=data.HoTen,
        ChucDanh=data.ChucDanh,
        DonVi=data.DonVi,
        GioiThieu=data.GioiThieu
    )

    db.add(new_speaker)
    db.commit()
    db.refresh(new_speaker)

    return new_speaker


# =========================================================
# 3. CHI TIẾT DIỄN GIẢ (PUBLIC)
# =========================================================

@router.get("/{speaker_id}", response_model=DienGiaResponse)
def get_speaker_by_id(
    speaker_id: int,
    db: Session = Depends(get_db)
):
    speaker = db.query(DienGia).filter(DienGia.DienGiaId == speaker_id).first()
    if speaker is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy diễn giả"
        )
    return speaker


# =========================================================
# 4. CẬP NHẬT DIỄN GIẢ (ADMIN / ORGANIZER)
# =========================================================

@router.put("/{speaker_id}", response_model=DienGiaResponse)
def update_speaker(
    speaker_id: int,
    data: DienGiaCreate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN", "ORGANIZER"))
):
    speaker = db.query(DienGia).filter(DienGia.DienGiaId == speaker_id).first()
    if speaker is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy diễn giả"
        )

    speaker.HoTen = data.HoTen
    speaker.ChucDanh = data.ChucDanh
    speaker.DonVi = data.DonVi
    speaker.GioiThieu = data.GioiThieu

    db.commit()
    db.refresh(speaker)

    return speaker


# =========================================================
# 5. XÓA DIỄN GIẢ (ADMIN / ORGANIZER)
# =========================================================

@router.delete("/{speaker_id}")
def delete_speaker(
    speaker_id: int,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN", "ORGANIZER"))
):
    speaker = db.query(DienGia).filter(DienGia.DienGiaId == speaker_id).first()
    if speaker is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy diễn giả"
        )

    db.delete(speaker)
    db.commit()

    return {
        "message": "Xóa diễn giả thành công",
        "DienGiaId": speaker_id
    }
