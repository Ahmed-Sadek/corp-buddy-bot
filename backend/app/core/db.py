import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./data/buddy.db")


class Base(DeclarativeBase):
    pass


# SQLite needs check_same_thread=False for FastAPI
engine = create_engine(DB_URL, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    from typing import Generator

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


