from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_admin, verify_password, create_token
from app.database import get_db, release_db
from app.models.dashboard import (
    DashboardStats, ChatVolumePoint, SessionSummary, LoginRequest, LoginResponse,
)

router = APIRouter(prefix="/api/admin", tags=["dashboard"])


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    db = await get_db()
    try:
        user = await db.fetchone(
            "SELECT * FROM admin_users WHERE email = ?", (data.email,)
        )
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_token(user["id"], user["email"])
        return LoginResponse(
            token=token,
            user={"id": user["id"], "email": user["email"], "name": user["name"]},
        )
    finally:
        await release_db(db)


@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(period: str = "week", _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        total = await db.fetchval("SELECT COUNT(*) FROM providers WHERE is_deleted = 0")
        verified = await db.fetchval("SELECT COUNT(*) FROM providers WHERE verification_status = 'verified' AND is_deleted = 0")
        unverified = await db.fetchval("SELECT COUNT(*) FROM providers WHERE verification_status = 'unverified' AND is_deleted = 0")
        archived = await db.fetchval("SELECT COUNT(*) FROM providers WHERE verification_status = 'archived' AND is_deleted = 0")

        period_filter = _get_period_filter(period)
        chat_sessions = await db.fetchval(f"SELECT COUNT(*) FROM chat_sessions WHERE {period_filter}")

        row = await db.fetchone(
            """SELECT
                CAST(SUM(CASE WHEN rating = 'up' THEN 1 ELSE 0 END) AS FLOAT) /
                NULLIF(COUNT(*), 0) as ratio
            FROM chat_feedback"""
        )
        avg_feedback = round((row["ratio"] or 0) * 5, 1) if row else 0

        messages = await db.fetch(
            """SELECT content FROM chat_messages
            WHERE role = 'user'
            ORDER BY created_at DESC LIMIT 50"""
        )
        top_themes = _extract_themes([m["content"] for m in messages])

        return DashboardStats(
            total_providers=total,
            verified=verified,
            unverified=unverified,
            archived=archived,
            chat_sessions=chat_sessions,
            avg_feedback=avg_feedback,
            top_themes=top_themes,
        )
    finally:
        await release_db(db)


@router.get("/dashboard/chat-volume")
async def chat_volume(period: str = "week", _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        if period == "today":
            where_clause = "date(started_at) = date('now')"
        elif period == "all":
            where_clause = "1=1"
        else:
            days = 30 if period == "month" else 7
            where_clause = f"started_at >= datetime('now', '-{days} days')"

        rows = await db.fetch(
            f"""SELECT date(started_at) as date, COUNT(*) as count
            FROM chat_sessions
            WHERE {where_clause}
            GROUP BY date(started_at)
            ORDER BY date"""
        )
        return {"data": [{"date": str(r["date"]), "count": r["count"]} for r in rows]}
    finally:
        await release_db(db)


@router.get("/dashboard/recent-sessions")
async def recent_sessions(
    page: int = 1, per_page: int = 20, _admin: dict = Depends(require_admin)
):
    db = await get_db()
    try:
        offset = (page - 1) * per_page
        total = await db.fetchval("SELECT COUNT(*) FROM chat_sessions")

        rows = await db.fetch(
            """SELECT cs.*,
                (SELECT AVG(CASE WHEN cf.rating = 'up' THEN 1.0 ELSE 0.0 END)
                 FROM chat_feedback cf WHERE cf.session_id = cs.id) as avg_rating
            FROM chat_sessions cs
            ORDER BY cs.last_message_at DESC
            LIMIT ? OFFSET ?""",
            (per_page, offset),
        )
        sessions = []
        for d in rows:
            loc = None
            if d.get("user_location"):
                try:
                    loc = json.loads(d["user_location"])
                except (json.JSONDecodeError, TypeError):
                    pass
            sessions.append(
                SessionSummary(
                    id=d["id"],
                    started_at=d["started_at"],
                    message_count=d["message_count"],
                    user_location=loc,
                    escalated=bool(d["escalated"]),
                    avg_rating=round(d["avg_rating"] * 5, 1) if d.get("avg_rating") else None,
                )
            )
        return {"sessions": sessions, "total": total}
    finally:
        await release_db(db)


@router.get("/dashboard/sessions/{session_id}")
async def get_session(session_id: str, _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        session = await db.fetchone(
            "SELECT * FROM chat_sessions WHERE id = ?", (session_id,)
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        messages = await db.fetch(
            "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at",
            (session_id,),
        )
        feedback = await db.fetch(
            "SELECT * FROM chat_feedback WHERE session_id = ?", (session_id,)
        )

        session_dict = dict(session)
        if session_dict.get("user_location"):
            try:
                session_dict["user_location"] = json.loads(session_dict["user_location"])
            except (json.JSONDecodeError, TypeError):
                pass

        return {
            "session": session_dict,
            "messages": messages,
            "feedback": feedback,
        }
    finally:
        await release_db(db)


def _get_period_filter(period: str) -> str:
    if period == "today":
        return "date(started_at) = date('now')"
    elif period == "month":
        return "started_at >= datetime('now', '-30 days')"
    elif period == "all":
        return "1=1"
    else:  # week
        return "started_at >= datetime('now', '-7 days')"


def _extract_themes(messages: list[str]) -> list[str]:
    """Simple keyword-based theme extraction."""
    theme_keywords = {
        "reading evaluation": ["reading", "evaluation", "evaluate"],
        "affordable tutoring": ["affordable", "tutor", "tutoring", "free", "low cost"],
        "IEP process": ["iep", "individualized education"],
        "adult ADHD assessment": ["adult", "adhd", "assessment"],
        "workplace accommodations": ["workplace", "accommodation", "work"],
        "dyslexia support": ["dyslexia", "reading disability"],
        "school struggles": ["school", "struggling", "grade", "teacher"],
        "finding providers": ["find", "provider", "recommend", "looking for"],
    }

    theme_counts = {}
    combined = " ".join(messages).lower()

    for theme, keywords in theme_keywords.items():
        count = sum(combined.count(k) for k in keywords)
        if count > 0:
            theme_counts[theme] = count

    sorted_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)
    return [t[0] for t in sorted_themes[:5]]
