import logging
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.qa_engine import QAEngine
from ..core.vector_store import VectorStore
from ..models.schemas import ChatRequest, ChatResponse
from ..models.tables import FAQ

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize components
vector_store = VectorStore()
qa_engine = QAEngine()

def _search_faqs(db: Session, query: str, limit: int = 3):
    terms = [t for t in query.split() if len(t) > 2][:4]
    if not terms:
        return []
    q = db.query(FAQ)
    # simple OR match across terms
    from sqlalchemy import or_
    filters = []
    for t in terms:
        like = f"%{t}%"
        filters.append(FAQ.question.ilike(like))
        filters.append(FAQ.answer.ilike(like))
    q = q.filter(or_(*filters)).order_by(FAQ.updated_at.desc()).limit(limit)
    return q.all()


@router.post("/query", response_model=ChatResponse)
async def query_documents(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Process a user query and return an AI-generated answer based on the document collection.
    """
    try:
        start_time = time.time()
        
        # Validate query
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Check if QA engine is available
        if not qa_engine.is_available():
            raise HTTPException(
                status_code=503, 
                detail="AI service unavailable. Please ensure OPENAI_API_KEY is configured."
            )
        
        # Retrieve relevant documents from vector DB
        relevant_docs = vector_store.retrieve(
            query=request.query, 
            top_k=request.max_results or 5
        )
        # Retrieve relevant structured FAQs and inject into contexts
        try:
            faq_rows = _search_faqs(db, request.query, limit=3)
            if faq_rows:
                from langchain.schema import Document
                faq_docs = [
                    Document(
                        page_content=f"FAQ Q: {r.question}\nFAQ A: {r.answer}",
                        metadata={"source": f"FAQ:{r.id}", "category": r.category or "FAQ"},
                    )
                    for r in faq_rows
                ]
                relevant_docs = (faq_docs + relevant_docs)[: (request.max_results or 5)]
        except Exception:
            pass
        
        if not relevant_docs:
            return ChatResponse(
                answer="I don't have any relevant information in my knowledge base to answer your question. Please try rephrasing your question or ensure that relevant documents have been uploaded.",
                sources=[],
                context_count=0,
                model_used=qa_engine.model,
                tokens_used=0
            )
        
        # Generate answer using QA engine
        result = qa_engine.answer_question(request.query, relevant_docs)
        
        processing_time = time.time() - start_time
        logger.info(f"Processed query in {processing_time:.2f}s: {request.query[:50]}...")
        
        return ChatResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query '{request.query}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@router.get("/health")
async def chat_health():
    """
    Check the health of the chat service components.
    """
    try:
        vector_stats = vector_store.get_collection_stats()
        qa_info = qa_engine.get_model_info()
        
        return {
            "status": "healthy" if qa_engine.is_available() else "degraded",
            "vector_store": vector_stats,
            "qa_engine": qa_info,
            "available_documents": vector_stats.get("total_documents", 0)
        }
        
    except Exception as e:
        logger.error(f"Error checking chat health: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@router.post("/test")
async def test_query():
    """
    Test endpoint to verify the chat system is working.
    """
    test_request = ChatRequest(
        query="What medical information is available?",
        max_results=3
    )
    
    try:
        response = await query_documents(test_request)
        return {
            "test_status": "success",
            "response": response
        }
    except Exception as e:
        return {
            "test_status": "failed",
            "error": str(e)
        }