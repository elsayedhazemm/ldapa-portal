from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_admin, verify_password, create_token
from app.database import get_db
from app.models.dashboard import (
    DashboardStats, ChatVolumePoint, SessionSummary, LoginRequest, LoginResponse,
)

router = APIRouter(prefix="/api/admin", tags=["dashboard"])


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM admin_users WHERE email = ?", (data.email,)
        )
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_dict = dict(user)
        if not verify_password(data.password, user_dict["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_token(user_dict["id"], user_dict["email"])
        return LoginResponse(
            token=token,
            user={"id": user_dict["id"], "email": user_dict["email"], "name": user_dict["name"]},
        )
    finally:
        await db.close()


@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(period: str = "week", _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        # Provider counts
        cursor = await db.execute(
            "SELECT COUNT(*) FROM providers WHERE is_deleted = 0"
        )
        total = (await cursor.fetchone())[0]

        cursor = await db.execute(
            "SELECT COUNT(*) FROM providers WHERE verification_status = 'verified' AND is_deleted = 0"
        )
        verified = (await cursor.fetchone())[0]

        cursor = await db.execute(
            "SELECT COUNT(*) FROM providers WHERE verification_status = 'unverified' AND is_deleted = 0"
        )
        unverified = (await cursor.fetchone())[0]

        cursor = await db.execute(
            "SELECT COUNT(*) FROM providers WHERE verification_status = 'archived' AND is_deleted = 0"
        )
        archived = (await cursor.fetchone())[0]

        # Chat sessions
        period_filter = _get_period_filter(period)
        cursor = await db.execute(
            f"SELECT COUNT(*) FROM chat_sessions WHERE {period_filter}"
        )
        chat_sessions = (await cursor.fetchone())[0]

        # Average feedback
        cursor = await db.execute(
            """SELECT
                CAST(SUM(CASE WHEN rating = 'up' THEN 1 ELSE 0 END) AS FLOAT) /
                NULLIF(COUNT(*), 0)
            FROM chat_feedback"""
        )
        row = await cursor.fetchone()
        avg_feedback = round((row[0] or 0) * 5, 1)

        # Top themes (simple keyword extraction from recent messages)
        cursor = await db.execute(
            """SELECT content FROM chat_messages
            WHERE role = 'user'
            ORDER BY created_at DESC LIMIT 50"""
        )
        messages = await cursor.fetchall()
        top_themes = _extract_themes([dict(m)["content"] for m in messages])

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
        await db.close()


@router.get("/dashboard/chat-volume")
async def chat_volume(period: str = "week", _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        if period == "month":
            days = 30
        else:
            days = 7

        cursor = await db.execute(
            f"""SELECT date(started_at) as date, COUNT(*) as count
            FROM chat_sessions
            WHERE started_at >= datetime('now', '-{days} days')
            GROUP BY date(started_at)
            ORDER BY date"""
        )
        rows = await cursor.fetchall()
        return {"data": [{"date": dict(r)["date"], "count": dict(r)["count"]} for r in rows]}
    finally:
        await db.close()


@router.get("/dashboard/recent-sessions")
async def recent_sessions(
    page: int = 1, per_page: int = 20, _admin: dict = Depends(require_admin)
):
    db = await get_db()
    try:
        offset = (page - 1) * per_page
        cursor = await db.execute("SELECT COUNT(*) FROM chat_sessions")
        total = (await cursor.fetchone())[0]

        cursor = await db.execute(
            """SELECT cs.*,
                (SELECT AVG(CASE WHEN cf.rating = 'up' THEN 1.0 ELSE 0.0 END)
                 FROM chat_feedback cf WHERE cf.session_id = cs.id) as avg_rating
            FROM chat_sessions cs
            ORDER BY cs.last_message_at DESC
            LIMIT ? OFFSET ?""",
            (per_page, offset),
        )
        rows = await cursor.fetchall()
        sessions = []
        for r in rows:
            d = dict(r)
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
        await db.close()


@router.get("/dashboard/sessions/{session_id}")
async def get_session(session_id: str, _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM chat_sessions WHERE id = ?", (session_id,)
        )
        session = await cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        cursor = await db.execute(
            "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at",
            (session_id,),
        )
        messages = [dict(m) for m in await cursor.fetchall()]

        cursor = await db.execute(
            "SELECT * FROM chat_feedback WHERE session_id = ?", (session_id,)
        )
        feedback = [dict(f) for f in await cursor.fetchall()]

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
        await db.close()


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
