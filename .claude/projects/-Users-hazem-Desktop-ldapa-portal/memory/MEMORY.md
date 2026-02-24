# LDAPA Portal Project Memory

## Project Overview
LDAPA (Learning Disabilities Association of PA) portal with two web apps + shared backend.
- Public portal: Landing page + LLM-powered chat for finding LD support providers
- Admin panel: Provider CRUD, bulk import, dashboard stats, chat review

## Architecture
- `backend/` - FastAPI (Python 3.9, requires eval-type-backport for Pydantic type hints)
- `public-portal/` - Next.js 15 App Router (port 3000)
- `admin-panel/` - Next.js 15 App Router (port 3001)
- `database/` - SQLite (dev), schema.sql + seed.sql with 12 sample providers

## Key Details
- Admin login: admin@ldapa.org / admin123
- DB: SQLite file at backend/ldapa.db (auto-created on startup)
- LLM: Anthropic Claude API with keyword fallback when no API key
- Chat uses two-call pattern: filter extraction → DB query → response generation
- Python 3.9 on this machine — needs `from __future__ import annotations` and eval-type-backport
