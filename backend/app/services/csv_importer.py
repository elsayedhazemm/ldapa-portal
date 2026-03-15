from __future__ import annotations

import csv
import io
import re
import uuid


VALID_PROFESSIONS = {"Tutor", "Health_Professional", "Lawyer", "School", "Advocate"}

# Patterns for extracting city from address1
# "123 Main St, Pittsburgh, PA 15213" or "Pittsburgh, PA 15213" or just "Pittsburgh"
_CITY_STATE_ZIP = re.compile(
    r"(?:.*,\s*)?([A-Z][a-zA-Z\s.\-']+?),\s*(?:PA|Pennsylvania)\b",
    re.IGNORECASE,
)
_JUST_CITY = re.compile(r"^([A-Z][a-zA-Z\s.\-']+)$")


def _parse_city(address1: str, city_col: str, city_cap: str, state_ln: str) -> str | None:
    """Try to extract a city name, with fallback chain."""
    # 1. Try parsing city from address1
    if address1:
        m = _CITY_STATE_ZIP.search(address1)
        if m:
            candidate = m.group(1).strip()
            # Reject if it looks like a street (has numbers or "St"/"Ave" etc)
            if not re.search(r"\d", candidate) and len(candidate) > 2:
                return candidate
        # If address1 is just a city name (no street, no state)
        m = _JUST_CITY.match(address1.strip())
        if m and len(m.group(1).strip()) > 2:
            return m.group(1).strip()

    # 2. Try the 'city' column (rarely populated)
    if city_col and city_col.strip():
        return city_col.strip()

    # 3. Try the 'City' column
    if city_cap and city_cap.strip():
        return city_cap.strip()

    return None


def _parse_bool(value: str) -> int:
    """Parse a value as boolean 0/1. Handles '0', '1', '$1.00', empty, etc."""
    v = value.strip().lower()
    if not v or v == "0" or v == "no" or v == "false":
        return 0
    return 1


def _clean_email(email_upper: str, email_lower: str) -> str | None:
    """Pick the best email, filtering out placeholder directory emails."""
    # Prefer Email (uppercase, 89% filled), fall back to email (lowercase)
    email = (email_upper or "").strip() or (email_lower or "").strip()
    if not email:
        return None
    # Filter out placeholder directory emails
    if "@ldaofpadirectory.com" in email.lower():
        return None
    return email


def _safe_float(value: str) -> float | None:
    """Parse a float, returning None on failure."""
    try:
        v = float(value.strip())
        return v if v != 0 else None
    except (ValueError, TypeError):
        return None


def parse_csv(content: str) -> dict:
    """Parse the LDAPA directory CSV export into provider records.

    Returns {valid: [...], warnings: [...], errors: [...]}.
    """
    reader = csv.DictReader(io.StringIO(content))

    valid = []
    warnings = []
    errors = []

    for i, row in enumerate(reader, start=1):
        row_warnings = []

        first_name = (row.get("first_name") or "").strip()
        last_name = (row.get("last_name") or "").strip()
        name = f"{first_name} {last_name}".strip()

        if not name:
            errors.append(f"Row {i}: Missing name (first_name + last_name)")
            continue

        profession = (row.get("profession_name") or "").strip()
        if not profession:
            errors.append(f"Row {i}: Missing profession_name")
            continue
        if profession not in VALID_PROFESSIONS:
            row_warnings.append(f"Row {i}: Unknown profession_name '{profession}'")

        # Location
        address1 = (row.get("address1") or "").strip()
        city = _parse_city(
            address1,
            row.get("city", ""),
            row.get("City", ""),
            row.get("state_ln", ""),
        )
        state_ln = (row.get("state_ln") or "").strip() or "Pennsylvania"
        state_code = (row.get("state_code") or "").strip() or "PA"

        if not city:
            row_warnings.append(f"Row {i}: Could not parse city from address '{address1}'")

        provider = {
            "id": str(uuid.uuid4()),
            "first_name": first_name or None,
            "last_name": last_name or None,
            "name": name,
            "listing_type": (row.get("listing_type") or "").strip() or None,
            "profession_name": profession,
            "services": (row.get("services") or "").strip() or None,
            "training": (row.get("training") or "").strip() or None,
            "credentials": (row.get("credentials") or row.get("Credentials") or "").strip() or None,
            "license": (row.get("license") or "").strip() or None,
            "address": address1 or None,
            "city": city,
            "state": state_ln,
            "state_code": state_code,
            "zip_code": (row.get("zip_code") or "").strip() or None,
            "lat": _safe_float(row.get("lat", "")),
            "lon": _safe_float(row.get("lon", "")),
            "age_range_served": (row.get("agerangeserved") or "").strip() or None,
            "grades_offered": (row.get("grades_offered") or "").strip() or None,
            "price_per_visit": (row.get("pricepervisit") or "").strip() or None,
            "sliding_scale": _parse_bool(row.get("Slidingscaleoffered", "")),
            "insurance_accepted": (row.get("insurancesaccepted") or "").strip() or None,
            "ld_adhd_specialty": _parse_bool(row.get("LDADHDspeciality", "")),
            "learning_difference_support": _parse_bool(row.get("learning_difference_support", "")),
            "adhd_support": _parse_bool(row.get("adhd_support", "")),
            "student_body_type": (row.get("student_body_type") or "").strip() or None,
            "total_size": (row.get("total_size") or "").strip() or None,
            "average_class_size": (row.get("average_class_size") or "").strip() or None,
            "religion": (row.get("religion") or "").strip() or None,
            "phone": (row.get("phone_number") or row.get("PhoneNumber") or "").strip() or None,
            "email": _clean_email(row.get("Email", ""), row.get("email", "")),
            "website": (row.get("website") or row.get("Website") or "").strip() or None,
            "profile_url": (row.get("profile_url") or "").strip() or None,
        }

        warnings.extend(row_warnings)
        valid.append(provider)

    return {"valid": valid, "warnings": warnings, "errors": errors}
