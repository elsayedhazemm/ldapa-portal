from __future__ import annotations

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_providers: int
    verified: int
    unverified: int
    archived: int
    chat_sessions: int
    avg_feedback: float
    top_themes: list[str]


class ChatVolumePoint(BaseModel):
    date: str
    count: int


class SessionSummary(BaseModel):
    id: str
    started_at: str
    message_count: int
    user_location: dict | None
    escalated: bool
    avg_rating: float | None


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict
