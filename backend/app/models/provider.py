from __future__ import annotations

from pydantic import BaseModel


class ProviderCreate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    name: str
    listing_type: str | None = None
    profession_name: str
    services: str | None = None
    training: str | None = None
    credentials: str | None = None
    license: str | None = None
    address: str | None = None
    city: str | None = None
    state: str = "PA"
    state_code: str = "PA"
    zip_code: str | None = None
    lat: float | None = None
    lon: float | None = None
    age_range_served: str | None = None
    grades_offered: str | None = None
    price_per_visit: str | None = None
    sliding_scale: bool = False
    insurance_accepted: str | None = None
    ld_adhd_specialty: bool = False
    learning_difference_support: bool = False
    adhd_support: bool = False
    student_body_type: str | None = None
    total_size: str | None = None
    average_class_size: str | None = None
    religion: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    profile_url: str | None = None
    staff_notes: str | None = None


class ProviderUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None
    listing_type: str | None = None
    profession_name: str | None = None
    services: str | None = None
    training: str | None = None
    credentials: str | None = None
    license: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    state_code: str | None = None
    zip_code: str | None = None
    lat: float | None = None
    lon: float | None = None
    age_range_served: str | None = None
    grades_offered: str | None = None
    price_per_visit: str | None = None
    sliding_scale: bool | None = None
    insurance_accepted: str | None = None
    ld_adhd_specialty: bool | None = None
    learning_difference_support: bool | None = None
    adhd_support: bool | None = None
    student_body_type: str | None = None
    total_size: str | None = None
    average_class_size: str | None = None
    religion: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    profile_url: str | None = None
    verification_status: str | None = None
    staff_notes: str | None = None


class ProviderResponse(BaseModel):
    id: str
    first_name: str | None
    last_name: str | None
    name: str
    listing_type: str | None
    profession_name: str
    services: str | None
    training: str | None
    credentials: str | None
    license: str | None
    address: str | None
    city: str | None
    state: str
    state_code: str
    zip_code: str | None
    lat: float | None
    lon: float | None
    age_range_served: str | None
    grades_offered: str | None
    price_per_visit: str | None
    sliding_scale: bool
    insurance_accepted: str | None
    ld_adhd_specialty: bool
    learning_difference_support: bool
    adhd_support: bool
    student_body_type: str | None
    total_size: str | None
    average_class_size: str | None
    religion: str | None
    phone: str | None
    email: str | None
    website: str | None
    profile_url: str | None
    verification_status: str
    last_verified_at: str | None
    staff_notes: str | None
    created_at: str
    updated_at: str
