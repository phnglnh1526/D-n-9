from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..auth_service import (
    create_access_token,
    get_current_user,
    verify_password,
)
from ..database import get_db
from ..models import NguoiDung
from ..schemas import (
    NguoiDungResponse,
    TokenResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = (
        db.query(NguoiDung)
        .filter(
            NguoiDung.Email == form_data.username
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng"
        )

    if not verify_password(
        form_data.password,
        user.MatKhauHash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng"
        )

    token = create_access_token(
        user.NguoiDungId
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get(
    "/me",
    response_model=NguoiDungResponse
)
def get_me(
    current_user: NguoiDung = Depends(
        get_current_user
    )
):
    return current_user