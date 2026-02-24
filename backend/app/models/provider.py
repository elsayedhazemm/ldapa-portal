from __future__ import annotations

from pydantic import BaseModel


class ProviderCreate(BaseModel):
    name: str
    organization: str | None = None
    service_types: list[str]
    specializations: list[str] = []
    serves_ages: list[str] = []
    address: str | None = None
    city: str
    state: str = "PA"
    zip_code: str | None = None
    region: str | None = None
    cost_tier: str
    insurance_accepted: bool = False
    accepts_medicaid: bool = False
    cost_notes: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    description: str | None = None
    staff_notes: str | None = None


class ProviderUpdate(BaseModel):
    name: str | None = None
    organization: str | None = None
    service_types: list[str] | None = None
    specializations: list[str] | None = None
    serves_ages: list[str] | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    region: str | None = None
    cost_tier: str | None = None
    insurance_accepted: bool | None = None
    accepts_medicaid: bool | None = None
    cost_notes: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    description: str | None = None
    verification_status: str | None = None
    staff_notes: str | None = None


class ProviderResponse(BaseModel):
    id: str
    name: str
    organization: str | None
    service_types: list[str]
    specializations: list[str]
    serves_ages: list[str]
    address: str | None
    city: str
    state: str
    zip_code: str | None
    region: str | None
    cost_tier: str
    insurance_accepted: bool
    accepts_medicaid: bool
    cost_notes: str | None
    phone: str | None
    email: str | None
    website: str | None
    description: str | None
    verification_status: str
    last_verified_at: str | None
    staff_notes: str | None
    created_at: str
    updated_at: str
