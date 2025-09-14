#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE:-http://localhost:8000}

echo "[1] Health"
curl -sS ${API_BASE}/health | jq . >/dev/null

echo "[2] Auth (demo)"
curl -sS -X POST ${API_BASE}/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"ahmed.elsadek@linkdev.com","password":"123456789"}' | jq . >/dev/null

echo "[3] Upload doc sample (if exists)"
if [ -f backend/uploads/sample.pdf ]; then
  curl -sS -X POST ${API_BASE}/api/documents/upload -F file=@backend/uploads/sample.pdf | jq . >/dev/null || true
fi

echo "[4] List documents"
curl -sS ${API_BASE}/api/documents/list | jq . >/dev/null

echo "[5] Create FAQ"
FAQ_ID=$(curl -sS -X POST ${API_BASE}/api/faqs/ -H 'Content-Type: application/json' \
  -d '{"question":"What is remote work policy?","answer":"Up to 3 days/week with manager approval.","category":"Work"}' | jq -r .id)

echo "[6] Chat query"
curl -sS -X POST ${API_BASE}/api/chat/query -H 'Content-Type: application/json' \
  -d '{"query":"What is remote work policy?","max_results":3}' | jq . >/dev/null

echo "[7] Leave request"
curl -sS -X POST ${API_BASE}/api/transactions/leave -H 'Content-Type: application/json' \
  -d '{"email":"ahmed.elsadek@linkdev.com","days":3,"reason":"vacation","start_date":"2025-09-15"}' | jq . >/dev/null

echo "[8] Latest leave"
curl -sS "${API_BASE}/api/transactions/leave/latest?email=ahmed.elsadek@linkdev.com" | jq . >/dev/null

echo "All tests passed"


