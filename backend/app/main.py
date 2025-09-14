import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import analytics, auth, chat, documents, faqs, transactions

# Create FastAPI app
app = FastAPI(
    title="Buddy API",
    description="Buddy chatbot backend with document processing and AI chat",
    version="1.0.0"
)

# Configure CORS for React frontend
# CORS configuration (env-driven with safe defaults for local dev)
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
env_origins = os.getenv("CORS_ORIGINS")
allow_origin_regex = os.getenv("CORS_ORIGIN_REGEX") or r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in env_origins.split(",") if o.strip()] if env_origins else default_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok=True)

# Mount static files for uploaded documents
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routers
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(faqs.router, prefix="/api/faqs", tags=["faqs"])

@app.get("/")
async def root():
    return {
        "message": "Buddy API is running",
        "version": "1.0.0",
        "endpoints": {
            "documents": "/api/documents",
            "chat": "/api/chat",
            "analytics": "/api/analytics",
            "transactions": "/api/transactions"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "buddy-api"}