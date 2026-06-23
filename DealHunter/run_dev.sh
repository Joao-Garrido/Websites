#!/usr/bin/env bash
# Sobe API (FastAPI) + frontend (Next.js) em modo dev.
set -e
cd "$(dirname "$0")"

echo "→ API em http://localhost:8000  (docs em /docs)"
python3 -m uvicorn api.main:app --reload --port 8000 &
API_PID=$!

trap "kill $API_PID 2>/dev/null" EXIT

cd frontend
[ -d node_modules ] || npm install
[ -f .env.local ] || cp .env.local.example .env.local
echo "→ Frontend em http://localhost:3000"
npm run dev
