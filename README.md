# LDAPA Intelligent Portal

An AI-powered web application that helps users find learning disability service providers across Pennsylvania. It features an anonymous public chat interface powered by OpenAI, and an admin dashboard for managing providers and viewing analytics.

## Architecture

| Component | Tech | Port |
|-----------|------|------|
| **Backend API** | FastAPI (Python) | 8000 |
| **Public Portal** | Next.js + Tailwind CSS | 3000 |
| **Admin Panel** | Next.js + Tailwind CSS | 3001 |
| **Database** | SQLite (dev) / PostgreSQL (prod) | — |

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** (comes with Node.js)
- **OpenAI API key** (optional — the system falls back to keyword-based matching without one)

## Getting Started

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your values (see Environment Variables below)

# Start the server
uvicorn app.main:app --port 8000 --reload
```

On first run the backend automatically creates the SQLite database, applies the schema, and seeds it with 12 sample providers and a default admin user.

Verify it's running: `http://localhost:8000/api/health` should return `{"status": "ok"}`.

### 2. Public Portal

```bash
cd public-portal

npm install

# Configure environment
cp .env.example .env.local

# Start the dev server
npm run dev -- -p 3000
```

Open **http://localhost:3000** to access the chat interface.

### 3. Admin Panel

```bash
cd admin-panel

npm install

# Configure environment
cp .env.example .env.local

# Start the dev server
npm run dev -- -p 3001
```

Open **http://localhost:3001** and log in with:

| Field | Value |
|-------|-------|
| Email | `admin@ldapa.org` |
| Password | `admin123` |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `ldapa.db` | Path to the SQLite file |
| `OPENAI_API_KEY` | *(empty)* | OpenAI key for LLM features; leave blank for keyword fallback |
| `JWT_SECRET` | `dev-secret-change-in-production` | Secret used to sign JWT tokens |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Allowed CORS origins (comma-separated) |
| `LLM_MODEL` | `gpt-4o-mini` | OpenAI model to use |

### Frontends (`public-portal/.env.local` and `admin-panel/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

## How the Chat Works

The chat uses a **two-LLM-call pattern**:

1. **Filter Extraction** — parses the user's message into structured filters (service type, specialization, cost, location, age group).
2. **Response Generation** — takes matching providers and generates a conversational answer.

If no OpenAI API key is configured, the first step falls back to keyword-based extraction, and responses are template-based.

## API Overview

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a chat message |
| POST | `/api/feedback` | Submit feedback on a message |
| GET | `/api/health` | Health check |

### Admin (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Authenticate and get a JWT token |
| GET | `/api/admin/dashboard/stats` | Dashboard statistics |
| GET | `/api/admin/dashboard/chat-volume` | Chat volume over time |
| GET | `/api/admin/dashboard/recent-sessions` | Paginated recent sessions |
| GET | `/api/admin/dashboard/sessions/{id}` | Full session with messages |
| GET | `/api/admin/providers` | List providers (search, filter, paginate) |
| POST | `/api/admin/providers` | Create a provider |
| PUT | `/api/admin/providers/{id}` | Update a provider |
| DELETE | `/api/admin/providers/{id}` | Soft-delete a provider |
| POST | `/api/admin/providers/import/preview` | Preview a CSV import |
| POST | `/api/admin/providers/import/confirm` | Confirm a CSV import |

## CSV Import

The admin panel supports bulk provider import via CSV. Required columns: `name`, `city`, `cost_tier`. See the import preview endpoint for validation details.

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Environment config
│   │   ├── auth.py              # JWT + bcrypt helpers
│   │   ├── database.py          # SQLite connection & init
│   │   ├── models/              # Pydantic request/response models
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic (LLM, search, CSV)
│   │   └── prompts/             # LLM system prompts
│   ├── requirements.txt
│   └── .env.example
├── public-portal/               # Next.js public chat UI
├── admin-panel/                 # Next.js admin dashboard
└── database/
    ├── schema.sql               # Table definitions
    └── seed.sql                 # Sample providers + default admin
```

## Production Notes

- **Change `JWT_SECRET`** to a cryptographically secure random string.
- **Change the default admin password** after first login.
- **Switch to PostgreSQL** — SQLite is for local development only.
- **Restrict `CORS_ORIGINS`** to your actual frontend domains.
- **Use HTTPS** for all traffic.
- **Secure your OpenAI API key** using a secrets manager.
