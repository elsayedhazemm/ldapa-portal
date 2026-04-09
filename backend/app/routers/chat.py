from __future__ import annotations

import json
import time
import uuid
from collections import defaultdict
from fastapi import APIRouter, HTTPException
from app.database import get_db, release_db
from app.models.chat import ChatRequest, ChatResponse, FeedbackRequest, ProviderCard
from app.services.llm import extract_filters, generate_response
from app.services.provider_search import search_providers, format_provider_context

router = APIRouter(prefix="/api", tags=["chat"])

# Simple in-memory rate limiter: {ip_or_session: [timestamps]}
_rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 30  # max requests
RATE_LIMIT_WINDOW = 60  # per 60 seconds


def _check_rate_limit(key: str) -> None:
    now = time.monotonic()
    timestamps = _rate_limits[key]
    # Remove expired entries
    _rate_limits[key] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[key]) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    _rate_limits[key].append(now)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    _check_rate_limit(request.session_id or "anon")

    db = await get_db()
    try:
        # Create or retrieve session
        session_id = request.session_id
        if not session_id:
            session_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO chat_sessions (id) VALUES (?)", (session_id,)
            )
            await db.commit()

        # Build conversation history
        history = [{"role": m.role, "content": m.content} for m in request.history]
        history.append({"role": "user", "content": request.message})

        # Call 1: Extract filters
        filters = await extract_filters(history)

        # Check for escalation or insufficient info
        escalate = filters.get("escalate", False)
        # After 3+ user turns, never block on needs_more_info — force a search attempt
        user_turn_count = sum(1 for m in history if m["role"] == "user")
        needs_more_info = filters.get("needs_more_info", False) and user_turn_count < 3
        providers_data = []
        provider_cards = []
        broadened = False

        if escalate:
            # Mark session as escalated
            await db.execute(
                "UPDATE chat_sessions SET escalated = 1 WHERE id = ?", (session_id,)
            )
        elif needs_more_info:
            # Skip provider search — LLM will ask follow-up questions
            pass
        elif filters.get("needs_providers", False):
            # Query database for matching providers (reuse existing db connection)
            providers_data, broadened = await search_providers(filters, db=db)
            provider_cards = [
                ProviderCard(
                    id=p["id"],
                    name=p["name"],
                    profession_name=p.get("profession_name", ""),
                    services=p.get("services"),
                    training=p.get("training"),
                    city=p.get("city"),
                    state_code=p.get("state_code", "PA"),
                    zip_code=p.get("zip_code"),
                    price_per_visit=p.get("price_per_visit"),
                    sliding_scale=p.get("sliding_scale", False),
                    insurance_accepted=p.get("insurance_accepted"),
                    age_range_served=p.get("age_range_served"),
                    phone=p.get("phone"),
                    email=p.get("email"),
                    website=p.get("website"),
                    credentials=p.get("credentials"),
                    listing_type=p.get("listing_type"),
                    grades_offered=p.get("grades_offered"),
                )
                for p in providers_data
            ]

        # Call 2: Generate response
        if escalate:
            provider_context = "_ESCALATE_"
        elif needs_more_info:
            provider_context = "Need more information from the user before searching. Ask follow-up questions."
        elif not filters.get("needs_providers", False):
            provider_context = "No provider search needed. The user is asking a general question — answer it directly."
        else:
            provider_context = format_provider_context(providers_data, broadened=broadened)
        response_text = await generate_response(history, provider_context)

        # Update location if extracted
        location = filters.get("location", {})
        if location.get("city") or location.get("zip"):
            location_json = json.dumps({k: v for k, v in location.items() if v})
            await db.execute(
                "UPDATE chat_sessions SET user_location = ? WHERE id = ?",
                (location_json, session_id),
            )

        # Store messages
        user_msg_id = str(uuid.uuid4())
        assistant_msg_id = str(uuid.uuid4())
        provider_ids = json.dumps([p.id for p in provider_cards])

        await db.execute(
            "INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, 'user', ?)",
            (user_msg_id, session_id, request.message),
        )
        await db.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, providers_shown) VALUES (?, ?, 'assistant', ?, ?)",
            (assistant_msg_id, session_id, response_text, provider_ids),
        )

        # Update session stats
        await db.execute(
            """UPDATE chat_sessions SET
                message_count = message_count + 2,
                last_message_at = datetime('now')
            WHERE id = ?""",
            (session_id,),
        )
        await db.commit()

        return ChatResponse(
            session_id=session_id,
            response=response_text,
            providers=provider_cards,
            escalate=escalate,
        )
    finally:
        await release_db(db)


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    db = await get_db()
    try:
        feedback_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO chat_feedback (id, message_id, session_id, rating) VALUES (?, ?, ?, ?)",
            (feedback_id, request.message_id, request.session_id, request.rating),
        )
        await db.commit()
        return {"success": True}
    finally:
        await release_db(db)


@router.get("/health")
async def health():
    return {"status": "ok"}
