from datetime import datetime

from app.auth_service import hash_password
from app.database import SessionLocal
from app.models import NguoiDung


db = SessionLocal()

try:

    email = "admin@test.com"

    user = (
        db.query(NguoiDung)
        .filter(
            NguoiDung.Email == email
        )
        .first()
    )

    if user:
        print("Tài khoản đã tồn tại.")

    else:

        user = NguoiDung(
            HoTen="Admin Demo",
            Email=email,
            MatKhauHash=hash_password(
                "Admin@123"
            ),
            VaiTro="ADMIN",
            NgayTao=datetime.now()
        )

        db.add(user)
        db.commit()

        print("Đã tạo tài khoản ADMIN.")

finally:
    db.close()