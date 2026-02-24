import csv
import io
import json


REQUIRED_FIELDS = ["name", "city", "cost_tier"]
VALID_SERVICE_TYPES = {"evaluator", "tutor", "advocate", "therapist", "school_psychologist", "clinic", "support_group", "nonprofit_org"}
VALID_SPECIALIZATIONS = {"dyslexia", "adhd", "dyscalculia", "dysgraphia", "general_ld", "adult_ld", "iep_504", "workplace_accommodations"}
VALID_COST_TIERS = {"free", "sliding_scale", "low_cost", "standard"}
VALID_AGE_GROUPS = {"children", "adolescents", "adults"}


def parse_csv(content: str) -> dict:
    reader = csv.DictReader(io.StringIO(content))

    valid = []
    warnings = []
    errors = []

    for i, row in enumerate(reader, start=1):
        row_errors = []
        row_warnings = []

        # Check required fields
        for field in REQUIRED_FIELDS:
            if not row.get(field, "").strip():
                row_errors.append(f"Row {i}: Missing required field '{field}'")

        if row_errors:
            errors.extend(row_errors)
            continue

        # Parse and validate
        provider = {
            "name": row.get("name", "").strip(),
            "organization": row.get("organization", "").strip() or None,
            "city": row.get("city", "").strip(),
            "state": row.get("state", "").strip() or "PA",
            "zip_code": row.get("zip_code", "").strip() or None,
            "region": row.get("region", "").strip() or None,
            "cost_tier": row.get("cost_tier", "").strip().lower(),
            "insurance_accepted": row.get("insurance_accepted", "").strip().lower() in ("true", "yes", "1"),
            "accepts_medicaid": row.get("accepts_medicaid", "").strip().lower() in ("true", "yes", "1"),
            "cost_notes": row.get("cost_notes", "").strip() or None,
            "phone": row.get("phone", "").strip() or None,
            "email": row.get("email", "").strip() or None,
            "website": row.get("website", "").strip() or None,
            "description": row.get("description", "").strip() or None,
            "address": row.get("address", "").strip() or None,
            "staff_notes": row.get("staff_notes", "").strip() or None,
        }

        # Parse array fields
        service_types_raw = [s.strip().lower() for s in row.get("service_types", "").split(",") if s.strip()]
        provider["service_types"] = [s for s in service_types_raw if s in VALID_SERVICE_TYPES]
        invalid_services = [s for s in service_types_raw if s not in VALID_SERVICE_TYPES]
        if invalid_services:
            row_warnings.append(f"Row {i}: Unknown service types: {', '.join(invalid_services)}")
        if not provider["service_types"]:
            row_errors.append(f"Row {i}: No valid service_types provided")
            errors.extend(row_errors)
            continue

        specs_raw = [s.strip().lower() for s in row.get("specializations", "").split(",") if s.strip()]
        provider["specializations"] = [s for s in specs_raw if s in VALID_SPECIALIZATIONS]

        ages_raw = [s.strip().lower() for s in row.get("serves_ages", "").split(",") if s.strip()]
        provider["serves_ages"] = [s for s in ages_raw if s in VALID_AGE_GROUPS]

        # Validate cost tier
        if provider["cost_tier"] not in VALID_COST_TIERS:
            row_warnings.append(f"Row {i}: Unknown cost_tier '{provider['cost_tier']}', defaulting to 'standard'")
            provider["cost_tier"] = "standard"

        warnings.extend(row_warnings)
        valid.append(provider)

    return {"valid": valid, "warnings": warnings, "errors": errors}
