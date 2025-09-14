import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from passlib.hash import pbkdf2_sha256
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.db import Base, engine, get_db
from ..models.tables import User

logger = logging.getLogger(__name__)

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    email: str
    role: str


def _ensure_tables():
    Base.metadata.create_all(bind=engine)


def seed_demo_user(db: Session):
    # Seed or update demo users (ensure known password hash algorithm)
    demo_users = [
        ("ahmed.elsadek@linkdev.com", "staff"),
        ("manager@linkdev.com", "manager"),
        ("employee@linkdev.com", "employee"),
        ("staff@linkdev.com", "staff"),
    ]
    for email, role in demo_users:
        email_l = email.lower()
        user = db.query(User).filter(User.email == email_l).first()
        if not user:
            user = User(email=email_l, password_hash=pbkdf2_sha256.hash("123456789"), role=role)
            db.add(user)
        else:
            # Force-set to PBKDF2 so logins work even if old bcrypt hash exists
            user.password_hash = pbkdf2_sha256.hash("123456789")
            user.role = role
            # Normalize existing emails to lowercase
            user.email = email_l
    db.commit()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    _ensure_tables()
    seed_demo_user(db)

    email_norm = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_norm).first()
    if not user or not pbkdf2_sha256.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return LoginResponse(email=user.email, role=user.role)


