from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=10000)


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str = Field(min_length=1, max_length=5000)
    history: list[ChatMessage] = []


class ProviderCard(BaseModel):
    id: str
    name: str
    profession_name: str
    services: str | None = None
    training: str | None = None
    city: str | None = None
    state_code: str = "PA"
    zip_code: str | None = None
    price_per_visit: str | None = None
    sliding_scale: bool = False
    insurance_accepted: str | None = None
    age_range_served: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    credentials: str | None = None
    listing_type: str | None = None
    # School-specific
    grades_offered: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    response: str
    providers: list[ProviderCard]
    escalate: bool


class FeedbackRequest(BaseModel):
    message_id: str
    session_id: str
    rating: Literal["positive", "negative"]
