from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import DangKy


def get_attendance_metrics(
    db: Session,
    event_id: int,
) -> dict[str, int | float]:
    """Return authoritative attendance metrics for one event."""
    total_registrations = (
        db.query(func.count(DangKy.DangKyId))
        .filter(DangKy.SuKienId == event_id)
        .scalar()
        or 0
    )

    checked_in = (
        db.query(func.count(DangKy.DangKyId))
        .filter(
            DangKy.SuKienId == event_id,
            DangKy.DaCheckIn.is_(True),
        )
        .scalar()
        or 0
    )

    not_checked_in = total_registrations - checked_in
    attendance_rate = (
        round(checked_in / total_registrations * 100, 2)
        if total_registrations
        else 0.0
    )

    return {
        "TongDangKy": total_registrations,
        "DaCheckIn": checked_in,
        "ChuaCheckIn": not_checked_in,
        "TyLeCheckIn": attendance_rate,
    }
