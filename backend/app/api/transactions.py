import logging
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()


class LeaveRequestIn(BaseModel):
    email: str
    days: int
    reason: Optional[str] = None
    start_date: Optional[str] = None  # ISO date


class LeaveRequestOut(BaseModel):
    id: str
    email: str
    days: int
    reason: Optional[str] = None
    status: str
    request_date: datetime
    remaining_days: int
    start_date: Optional[str] = None


from ..core.db import Base, engine, get_db
from ..core.notifications import EmailNotifier
from ..models.tables import LeaveRequest as LeaveRequestTable

Base.metadata.create_all(bind=engine)

_default_allowed_days = 15


@router.post("/leave", response_model=LeaveRequestOut)
async def create_leave_request(req: LeaveRequestIn, db: Session = Depends(get_db)):
    if req.days <= 0:
        raise HTTPException(status_code=400, detail="Days must be positive")

    status = "approved" if req.days <= _default_allowed_days else "rejected"
    row = LeaveRequestTable(
        user_email=req.email,
        days=req.days,
        reason=req.reason,
        start_date=req.start_date,
        status=status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    logger.info("Leave request created for %s: %s days -> %s", req.email, req.days, status)

    # Email notifications
    notifier = EmailNotifier()
    employee_subject = f"Leave request {row.id} {status}"
    employee_body = (
        f"Hello,\n\nYour leave request has been {status}.\n"
        f"Days: {row.days}\nStart date: {row.start_date or 'N/A'}\nReason: {row.reason or 'N/A'}\n\nRegards,\nBuddy"
    )
    notifier.send_email(req.email, employee_subject, employee_body)
    # Notify manager (demo)
    notifier.send_email("manager@linkdev.com", f"[Buddy] New leave request: {row.id}", employee_body)
    return LeaveRequestOut(
        id=str(row.id),
        email=row.user_email,
        days=row.days,
        reason=row.reason,
        status=row.status,
        request_date=row.created_at,
        remaining_days=_default_allowed_days,
        start_date=row.start_date,
    )


@router.get("/leave/latest", response_model=LeaveRequestOut)
async def get_latest_leave_request(email: str, db: Session = Depends(get_db)):
    row = (
        db.query(LeaveRequestTable)
        .filter(LeaveRequestTable.user_email == email)
        .order_by(LeaveRequestTable.created_at.desc())
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="No leave requests found for user")
    return LeaveRequestOut(
        id=str(row.id),
        email=row.user_email,
        days=row.days,
        reason=row.reason,
        status=row.status,
        request_date=row.created_at,
        remaining_days=_default_allowed_days,
        start_date=row.start_date,
    )


