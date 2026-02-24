# LDAPA Intelligent Portal

## Project Structure
- `backend/` - Python FastAPI API server (port 8000)
- `public-portal/` - Next.js public-facing chat portal (port 3000)
- `admin-panel/` - Next.js admin dashboard (port 3001)
- `database/` - SQL schema and seed data

## Quick Start
```bash
# Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --port 8000 --reload

# Public Portal (separate terminal)
cd public-portal && npm run dev -- -p 3000

# Admin Panel (separate terminal)
cd admin-panel && npm run dev -- -p 3001
```

## Default Admin Login
- Email: admin@ldapa.org
- Password: admin123

## Tech Stack
- Backend: FastAPI + SQLite (dev) / PostgreSQL (prod) + OpenAI API (gpt-4o-mini)
- Frontend: Next.js 15 + Tailwind CSS + TypeScript
- Auth: JWT-based (bcrypt + python-jose)

## Key Design Decisions
- SQLite for local dev, easily swappable to Postgres/Supabase for production
- Two-LLM-call pattern for chat: (1) filter extraction → (2) response generation
- Fallback keyword-based filter extraction when no LLM API key is set
- Soft-delete for providers (is_deleted flag)
- Anonymous chat sessions with optional location tracking
