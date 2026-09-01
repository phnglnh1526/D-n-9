from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth_service import get_current_user, hash_password, require_roles
from ..database import get_db
from ..models import NguoiDung
from ..schemas import NguoiDungCreate, NguoiDungResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =========================================================
# 1. DANH SÁCH NGƯỜI DÙNG (ADMIN ONLY)
# =========================================================

@router.get("", response_model=list[NguoiDungResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN"))
):
    users = db.query(NguoiDung).all()
    return users


# =========================================================
# 2. TẠO NGƯỜI DÙNG / BAN TỔ CHỨC (ADMIN ONLY)
# =========================================================

@router.post("", response_model=NguoiDungResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: NguoiDungCreate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(require_roles("ADMIN"))
):
    existing = db.query(NguoiDung).filter(NguoiDung.Email == data.Email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email đã tồn tại trên hệ thống"
        )

    new_user = NguoiDung(
        HoTen=data.HoTen,
        Email=data.Email,
        MatKhauHash=hash_password(data.MatKhau),
        VaiTro=data.VaiTro.upper(),
        NgayTao=datetime.now()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =========================================================
# 3. CHI TIẾT NGƯỜI DÙNG (ADMIN OR SELF)
# =========================================================

@router.get("/{user_id}", response_model=NguoiDungResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_user)
):
    if current_user.VaiTro != "ADMIN" and current_user.NguoiDungId != user_id:
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền xem thông tin người dùng này"
        )

    user = db.query(NguoiDung).filter(NguoiDung.NguoiDungId == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người dùng"
        )

    return user
