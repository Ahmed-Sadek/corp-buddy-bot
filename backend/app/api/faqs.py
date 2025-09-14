import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.db import Base, engine, get_db
from ..core.vector_store import VectorStore
from ..models.tables import FAQ

logger = logging.getLogger(__name__)

router = APIRouter()

Base.metadata.create_all(bind=engine)
vector_store = VectorStore()


class FAQIn(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None


class FAQOut(BaseModel):
    id: int
    question: str
    answer: str
    category: Optional[str] = None


@router.get("/", response_model=List[FAQOut])
def list_faqs(db: Session = Depends(get_db)):
    rows = db.query(FAQ).order_by(FAQ.updated_at.desc()).all()
    return [FAQOut(id=r.id, question=r.question, answer=r.answer, category=r.category) for r in rows]


@router.post("/", response_model=FAQOut)
def create_faq(payload: FAQIn, db: Session = Depends(get_db)):
    row = FAQ(question=payload.question, answer=payload.answer, category=payload.category)
    db.add(row)
    db.commit()
    db.refresh(row)

    # Reindex as a document chunk with source = FAQ
    try:
        vector_store.build_index(f"Q: {row.question}\nA: {row.answer}", source=f"FAQ:{row.id}")
    except Exception:
        logger.warning("FAQ reindex failed", exc_info=True)

    return FAQOut(id=row.id, question=row.question, answer=row.answer, category=row.category)


@router.put("/{faq_id}", response_model=FAQOut)
def update_faq(faq_id: int, payload: FAQIn, db: Session = Depends(get_db)):
    row = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="FAQ not found")
    row.question = payload.question
    row.answer = payload.answer
    row.category = payload.category
    db.commit()
    db.refresh(row)

    try:
        vector_store.build_index(f"Q: {row.question}\nA: {row.answer}", source=f"FAQ:{row.id}")
    except Exception:
        logger.warning("FAQ reindex failed", exc_info=True)

    return FAQOut(id=row.id, question=row.question, answer=row.answer, category=row.category)


@router.delete("/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db)):
    row = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(row)
    db.commit()
    return {"message": "deleted"}


