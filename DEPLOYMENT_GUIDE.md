# LDA of PA Portal — Deployment Guide

Deploy the backend to **Railway** (with PostgreSQL) and both frontends to **Vercel**.

---

## Architecture Overview

```
Vercel                          Railway
┌─────────────────┐            ┌─────────────────────────┐
│  Public Portal   │───────────│  FastAPI Backend         │
│  (Next.js)       │   API     │  (uvicorn)               │
└─────────────────┘            │                          │
                               │     ┌──────────────┐     │
┌─────────────────┐            │     │  PostgreSQL   │     │
│  Admin Panel     │───────────│     │  (managed)    │     │
│  (Next.js)       │   API     │     └──────────────┘     │
└─────────────────┘            └─────────────────────────┘
```

---

## Prerequisites

- GitHub repo pushed and up to date
- [Railway](https://railway.app) account (free tier works to start)
- [Vercel](https://vercel.com) account (free tier works)
- Your `OPENAI_API_KEY`

---

## Step 1: Code is Already PostgreSQL-Ready

The backend has a dual-mode database layer (`backend/app/database.py`) that supports both SQLite (local dev) and PostgreSQL (production). No code changes are needed — just set the `DATABASE_URL` environment variable on Railway and it switches automatically.

**How it works:**
- If `DATABASE_URL` starts with `postgres://`, the app uses `asyncpg` with a connection pool
- Otherwise, it uses `aiosqlite` with the local `ldapa.db` file
- SQL syntax differences (`?` vs `$1`, `datetime('now')` vs `CURRENT_TIMESTAMP`) are handled automatically by the DB wrapper

**Key files:**
- `backend/Procfile` — tells Railway how to start the app
- `backend/runtime.txt` — specifies Python 3.11
- `railway.json` — Railway deployment config

No frontend code changes needed — both apps read `NEXT_PUBLIC_API_URL` from environment.

---

## Step 2: Deploy Backend to Railway

### 2.1 Create a new project

1. Go to [railway.app](https://railway.app) and log in
2. Click **New Project**
3. Select **Deploy from GitHub Repo**
4. Choose the `elsayedhazemm/ldapa-portal` repository
5. Railway will create a service — click into it

### 2.2 Set the root directory

1. Go to the service **Settings** tab
2. Under **Root Directory**, enter: `backend`
3. This tells Railway to only build/deploy the backend folder

### 2.3 Add PostgreSQL

1. In the same Railway project, click **+ New** in the top right
2. Select **Database** → **PostgreSQL**
3. Railway automatically creates a `DATABASE_URL` variable and links it to your backend service
4. No manual wiring needed — the variable is injected at runtime

### 2.4 Set environment variables

Go to your backend service → **Variables** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | *(already injected by Railway)* | Verify it's there after adding PostgreSQL |
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key |
| `JWT_SECRET` | *(generate one)* | Run `openssl rand -hex 32` in your terminal to generate |
| `CORS_ORIGINS` | *(fill in after Vercel deploy)* | Will be like `https://your-portal.vercel.app,https://your-admin.vercel.app` |
| `LLM_MODEL` | `gpt-5-mini` | Or whichever model your project has access to |

### 2.5 Deploy

1. Railway auto-deploys on push to your default branch
2. Check the **Deployments** tab for build logs
3. Once deployed, go to **Settings** → **Networking** → **Generate Domain**
4. Note your public URL — it will look like:
   ```
   https://ldapa-backend-production-XXXX.up.railway.app
   ```

### 2.6 Verify

Visit `https://YOUR-RAILWAY-URL/api/health` in a browser — you should get a health check response.

---

## Step 3: Seed the Production Database

After the backend is deployed and tables are created (they auto-create on first startup), you need to import the provider data.

### Option A: Seed script (recommended)

A one-time Python script (`seed_production.py`) will be provided that:
1. Reads the CSV file (`export_members...csv`) from your local machine
2. Connects directly to the Railway PostgreSQL database
3. Inserts all 3,610 providers
4. Creates the default admin user

Run it locally:
```bash
# Get the DATABASE_URL from Railway dashboard → Variables tab
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway"
python seed_production.py
```

### Option B: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link to your project
railway login
railway link

# Run the seed script in Railway's environment (has DATABASE_URL auto-set)
railway run python seed_production.py
```

### Default admin credentials

The seed creates an admin user:
- **Email:** `admin@ldapa.org`
- **Password:** `admin123`

**Change this password immediately after first login.**

---

## Step 4: Deploy Public Portal to Vercel

### 4.1 Create the project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **Add New** → **Project**
3. Select **Import Git Repository** → choose `elsayedhazemm/ldapa-portal`

### 4.2 Configure the project

On the "Configure Project" screen:

| Setting | Value |
|---------|-------|
| **Project Name** | `ldapa-portal` (or your preference) |
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `public-portal` |

### 4.3 Set environment variables

In the same "Configure Project" screen, under **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL` (from Step 2.5) |

### 4.4 Deploy

Click **Deploy**. Vercel will build and deploy the public portal.

Note the URL — it will look like:
```
https://ldapa-portal.vercel.app
```

---

## Step 5: Deploy Admin Panel to Vercel

### 5.1 Create a second project

1. Back on the Vercel dashboard, click **Add New** → **Project**
2. Import the **same** GitHub repo again

### 5.2 Configure the project

| Setting | Value |
|---------|-------|
| **Project Name** | `ldapa-admin` (or your preference) |
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `admin-panel` |

### 5.3 Set environment variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL` (same backend URL) |

### 5.4 Deploy

Click **Deploy**. Note the URL:
```
https://ldapa-admin.vercel.app
```

---

## Step 6: Update CORS on Railway

Now that both Vercel projects are deployed, go back to Railway and update the `CORS_ORIGINS` variable:

1. Go to your Railway backend service → **Variables**
2. Set `CORS_ORIGINS` to both Vercel URLs, comma-separated:
   ```
   https://ldapa-portal.vercel.app,https://ldapa-admin.vercel.app
   ```
3. Railway will auto-redeploy with the new CORS settings

---

## Step 7: End-to-End Verification

### Public Portal
- [ ] Visit `https://ldapa-portal.vercel.app`
- [ ] Select a user type (Myself/Child/Other)
- [ ] Send a chat message (e.g., "I need a tutor in Philadelphia")
- [ ] Verify provider cards appear in the response
- [ ] Test the feedback (thumbs up/down) buttons

### Admin Panel
- [ ] Visit `https://ldapa-admin.vercel.app`
- [ ] Log in with `admin@ldapa.org` / `admin123`
- [ ] Verify the dashboard loads with stats
- [ ] Check the providers list (should show imported providers)
- [ ] Test creating/editing a provider
- [ ] Check chat sessions list

### Backend Health
- [ ] Visit `https://YOUR-RAILWAY-URL/api/health`
- [ ] Check Railway logs for any errors

---

## Custom Domains (Optional)

### Vercel
1. Go to your Vercel project → **Settings** → **Domains**
2. Add your custom domain (e.g., `portal.ldaofpa.org`)
3. Update DNS records as instructed by Vercel

### Railway
1. Go to your Railway service → **Settings** → **Networking** → **Custom Domain**
2. Add your domain (e.g., `api.ldaofpa.org`)
3. Update DNS records as instructed by Railway

If you add custom domains, update:
- `CORS_ORIGINS` on Railway to include the custom frontend domains
- `NEXT_PUBLIC_API_URL` on Vercel to use the custom backend domain

---

## Environment Variables Reference

### Railway (Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Auto-injected by Railway PostgreSQL plugin |
| `OPENAI_API_KEY` | Yes | OpenAI API key for chat LLM |
| `JWT_SECRET` | Yes | Secure random string for admin auth tokens |
| `CORS_ORIGINS` | Yes | Comma-separated Vercel frontend URLs |
| `LLM_MODEL` | No | Defaults to `gpt-5-mini` |
| `PORT` | Auto | Auto-injected by Railway |

### Vercel (Public Portal)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Railway backend URL |

### Vercel (Admin Panel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Railway backend URL |

---

## Troubleshooting

### CORS errors in browser console
- Verify `CORS_ORIGINS` on Railway matches the exact Vercel URLs (including `https://`, no trailing slash)
- Railway redeploys after variable changes — wait for it to finish

### "Internal Server Error" on chat
- Check Railway logs (Deployments → View Logs)
- Most likely: `OPENAI_API_KEY` not set or invalid

### Admin login fails
- Ensure the database was seeded (admin user exists)
- Check that `JWT_SECRET` is set on Railway

### Frontend shows "Chat request failed"
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel (no trailing slash)
- Check that the Railway backend is running and accessible

### Railway build fails
- Check that Root Directory is set to `backend`
- Check Railway build logs for missing dependencies
