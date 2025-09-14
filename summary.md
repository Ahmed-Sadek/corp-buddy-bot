# Buddy Chatbot – Onboarding & Employee Support

## Problem & Solution

Employees repeatedly ask HR/IT about policies and processes. Buddy provides instant answers from company docs and FAQs and supports simple transactions (leave requests, status checks).

## Tools Used

- Frontend: React + TypeScript + Tailwind + shadcn/ui
- Backend: FastAPI, SQLAlchemy (SQLite), ChromaDB, HuggingFace embeddings, OpenAI
- Orchestration: optional Airflow trigger on document ingestion
- Notifications: SMTP (or console fallback)
- Containers: Docker, docker-compose

## Architecture

```
React (Vite) ──> FastAPI ──────> ChromaDB (vector)
        │            │
        │            ├────> SQLite (Users, FAQs, LeaveRequests)
        │            └────> OpenAI (LLM)
```

- Ingestion: Staff uploads docs/FAQs → processed and indexed
- Retrieval: Chat queries vector store + structured FAQs
- Transactions: Leave requests stored in DB, email notifications sent

## Infra Notes

- Env-driven CORS, SMTP config, DB URL (SQLite by default)
- Dockerfiles for frontend/backend + compose
- Airflow DAG trigger via REST after indexing

## Test Coverage

- tests/run_tests.sh: smoke tests for health, auth, docs, FAQs, chat, leave

## Scalability / Next Steps

- Swap SQLite for Postgres; add migrations
- AuthN/AuthZ with JWT, route guards
- Streaming responses and citations UI
- Metrics dashboards; retry and rate limiting
- E2E tests (Playwright), unit tests (pytest)

Built with Cursor + Lovable for rapid UI iteration.
