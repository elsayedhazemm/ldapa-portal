from __future__ import annotations

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str
    history: list[ChatMessage] = []


class ProviderCard(BaseModel):
    id: str
    name: str
    organization: str | None
    service_types: list[str]
    city: str
    zip_code: str | None
    cost_tier: str
    phone: str | None
    email: str | None
    website: str | None
    description: str | None
    specializations: list[str] = []
    serves_ages: list[str] = []
    insurance_accepted: bool = False
    accepts_medicaid: bool = False
    cost_notes: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    response: str
    providers: list[ProviderCard]
    escalate: bool


class FeedbackRequest(BaseModel):
    message_id: str
    session_id: str
    rating: str
