# Buddy Backend (FastAPI)

FastAPI backend for Buddy Chatbot – Onboarding & Employee Support. Provides:

- Document upload and indexing (RAG via Chroma + HF embeddings)
- AI chat Q&A (OpenAI)
- Structured FAQs CRUD with auto-indexing
- Transactions (leave requests) with SQLite persistence
- Basic auth (demo), analytics, optional Airflow trigger, email notifications

## 🏗️ Architecture

```
React Frontend ↔ FastAPI Backend ↔ ChromaDB + OpenAI (+ Airflow optional)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key and optional Airflow config
OPENAI_API_KEY=your_openai_api_key_here
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_DAG_ID=buddy_doc_ingestion
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=admin
AIRFLOW_ENABLED=true
```

### 3. Start the Server

```bash
# Method 1: Using the run script
python run.py

# Method 2: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

### 4. Verify Installation

- API Documentation: <http://localhost:8000/docs>
- Health Check: <http://localhost:8000/health>
- Test the API: <http://localhost:8000/api/chat/health>
- Airflow (optional): <http://localhost:8080>

## 📋 API Endpoints

### Documents

- `POST /api/documents/upload` - Upload and process documents
- `GET /api/documents/list` - List all uploaded documents
- `GET /api/documents/stats` - Get document statistics
- `DELETE /api/documents/{filename}` - Delete a document
- Triggers Airflow (optional) after successful indexing

### Chat

- `POST /api/chat/query` - Query the RAG system
- `GET /api/chat/health` - Check chat system health
- `POST /api/chat/test` - Test the chat functionality

### Analytics

### Auth (demo)

- `POST /api/auth/login` – returns `{ email, role }` (seeded users)

### Transactions (demo)

- `POST /api/transactions/leave` – `{ email, days, reason?, start_date? }`
- `GET /api/transactions/leave/latest?email=...`

### FAQs

- `GET /api/faqs/`
- `POST /api/faqs/`
- `PUT /api/faqs/{id}`
- `DELETE /api/faqs/{id}`

- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/queries` - Get query logs
- `GET /api/analytics/health` - Get system health
- `GET /api/analytics/stats` - Get detailed statistics

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM | Required |
| `CHROMA_DB_PATH` | ChromaDB storage path | `./data/chroma_db` |
| `UPLOAD_DIR` | Document upload directory | `./uploads` |
| `API_HOST` | Server host | `0.0.0.0` |
| `API_PORT` | Server port | `8000` |
| `LOG_LEVEL` | Logging level | `INFO` |

### Supported Document Types

- PDF (`.pdf`)
- Word Documents (`.docx`, `.doc`)
- Text Files (`.txt`)
- Markdown (`.md`)

## 🧪 Testing

### Test Document Upload

```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your_document.pdf"
```

### Test Chat Query

```bash
curl -X POST "http://localhost:8000/api/chat/query" \
     -H "Content-Type: application/json" \
     -d '{"query": "What medical information is available?"}'
```

## 🔗 Frontend Integration

Your React frontend can now replace the mock functions with real API calls:

### Replace Patient Dashboard Chat

```typescript
// In PatientDashboard.tsx
const sendMessage = async (message: string) => {
  const response = await fetch('http://localhost:8000/api/chat/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: message })
  });
  const data = await response.json();
  return data.answer;
};
```

### Replace Admin Document Upload

```typescript
// In AdminDashboard.tsx
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:8000/api/documents/upload', {
    method: 'POST',
    body: formData
  });
  return await response.json();
};
```

## 📊 Features

- ✅ **Document Processing**: Automatic text extraction from PDFs, Word docs, etc.
- ✅ **Vector Search**: Semantic search using ChromaDB and HuggingFace embeddings
- ✅ **AI Chat**: OpenAI-powered question answering
- ✅ **Analytics**: Query logging and system monitoring
- ✅ **CORS Support**: Ready for React frontend integration
- ✅ **Auto Documentation**: Swagger/OpenAPI docs at `/docs`

## 🛠️ Development

### Project Structure

```
backend/
├── app/
│   ├── api/          # API route handlers
│   ├── core/         # Core RAG components
│   ├── models/       # Pydantic models
│   └── main.py       # FastAPI app
├── data/             # ChromaDB storage
├── uploads/          # Uploaded documents
├── requirements.txt  # Dependencies
└── run.py           # Server startup script
```

### Adding New Features

1. **New API endpoint**: Add to appropriate router in `app/api/`
2. **New data model**: Add to `app/models/schemas.py`
3. **New core functionality**: Add to `app/core/`

## 🚨 Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Ensure `OPENAI_API_KEY` is set in your `.env` file

2. **"No documents found for query"**
   - Upload some documents first using `/api/documents/upload`

3. **CORS errors from React**
   - Ensure your React dev server URL is in `CORS_ORIGINS`

4. **ChromaDB permission errors**
   - Ensure the `data/chroma_db` directory is writable

### Logs

Check the console output for detailed error messages and processing logs.

## 📈 Next Steps

1. Upload some medical documents via the API
2. Test queries through the chat endpoint
3. Update your React frontend to use these APIs
4. Monitor usage through the analytics endpoints

The backend is now ready to power your React frontend with real RAG capabilities!
