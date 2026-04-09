from __future__ import annotations

import math
from app.database import get_db


def _escape_like(value: str) -> str:
    """Escape special LIKE pattern characters."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# Approximate miles-per-degree at PA latitude (~40N)
_MILES_PER_DEG_LAT = 69.0
_MILES_PER_DEG_LON = 53.0  # cos(40deg) * 69


def _build_query(
    filters: dict,
    relax_city: bool = False,
    relax_age: bool = False,
) -> tuple[str, list]:
    """Build a provider search query. Returns (query_string, params)."""
    conditions = ["p.is_deleted = 0"]
    params = []

    # Profession types filter
    if filters.get("profession_types"):
        placeholders = ",".join("?" for _ in filters["profession_types"])
        conditions.append(f"LOWER(p.profession_name) IN ({placeholders})")
        params.extend(pt.lower() for pt in filters["profession_types"])

    # Specialization flags
    specs = filters.get("specializations", [])
    if specs:
        spec_conditions = []
        for spec in specs:
            s = spec.lower()
            if s in ("adhd",):
                spec_conditions.append("(p.adhd_support = 1 OR p.ld_adhd_specialty = 1)")
            elif s in ("ld", "learning_differences", "dyslexia"):
                spec_conditions.append("(p.learning_difference_support = 1 OR p.ld_adhd_specialty = 1)")
            # Also search in training text
            if s in ("dyslexia", "orton-gillingham", "wilson"):
                spec_conditions.append("LOWER(p.training) LIKE ? ESCAPE '\\'")
                params.append(f"%{_escape_like(s)}%")
        if spec_conditions:
            conditions.append(f"({' OR '.join(spec_conditions)})")

    # Training methodology filter
    if filters.get("training_methodology"):
        conditions.append("LOWER(p.training) LIKE ? ESCAPE '\\'")
        params.append(f"%{_escape_like(filters['training_methodology'].lower())}%")

    # Insurance filter
    if filters.get("insurance"):
        conditions.append("LOWER(p.insurance_accepted) LIKE ? ESCAPE '\\'")
        params.append(f"%{_escape_like(filters['insurance'].lower())}%")

    # Sliding scale / affordability
    if filters.get("sliding_scale"):
        conditions.append("p.sliding_scale = 1")

    # Age group filter (can be relaxed)
    if not relax_age and filters.get("age_group"):
        age_conditions = []
        for ag in filters["age_group"]:
            ag_lower = ag.lower()
            if ag_lower == "children":
                age_conditions.append(
                    "(LOWER(p.age_range_served) LIKE '%child%' ESCAPE '\\'"
                    " OR LOWER(p.age_range_served) LIKE '%preteens%' ESCAPE '\\'"
                    " OR LOWER(p.age_range_served) LIKE '%k-%' ESCAPE '\\')"
                )
            elif ag_lower == "adolescents":
                age_conditions.append(
                    "(LOWER(p.age_range_served) LIKE '%teen%' ESCAPE '\\'"
                    " OR LOWER(p.age_range_served) LIKE '%adolesc%' ESCAPE '\\')"
                )
            elif ag_lower == "adults":
                age_conditions.append(
                    "(LOWER(p.age_range_served) LIKE '%adult%' ESCAPE '\\'"
                    " OR LOWER(p.age_range_served) LIKE '%elder%' ESCAPE '\\')"
                )
        if age_conditions:
            conditions.append(f"({' OR '.join(age_conditions)})")

    # Location filter (can be relaxed to state-wide)
    if not relax_city:
        location = filters.get("location", {})
        if location.get("zip") and not location.get("_use_geo"):
            conditions.append("p.zip_code = ?")
            params.append(location["zip"])
        elif location.get("city"):
            conditions.append("LOWER(p.city) = LOWER(?)")
            params.append(location["city"])

    where_clause = " AND ".join(conditions)

    # Lawyer deprioritization: rank lawyers lower unless specifically requested
    wants_lawyer = any(
        pt.lower() == "lawyer" for pt in filters.get("profession_types", [])
    )
    lawyer_penalty = "" if wants_lawyer else "CASE WHEN p.profession_name = 'Lawyer' THEN 1 ELSE 0 END, "

    # Search text relevance
    search_text = filters.get("search_text", "")
    order_clause = f"{lawyer_penalty}p.name ASC"
    if search_text:
        order_clause = f"""
            {lawyer_penalty}
            CASE
                WHEN LOWER(p.name) LIKE LOWER(?) ESCAPE '\\' THEN 1
                WHEN LOWER(p.training) LIKE LOWER(?) ESCAPE '\\' THEN 2
                WHEN LOWER(p.services) LIKE LOWER(?) ESCAPE '\\' THEN 3
                ELSE 4
            END, p.name ASC
        """
        search_param = f"%{_escape_like(search_text)}%"
        params.extend([search_param, search_param, search_param])

    query = f"""
        SELECT p.* FROM providers p
        WHERE {where_clause}
        ORDER BY {order_clause}
        LIMIT 5
    """
    return query, params


def _build_geo_query(
    filters: dict,
    center_lat: float,
    center_lon: float,
    radius_miles: float = 30.0,
) -> tuple[str, list]:
    """Build a proximity-based provider search using lat/lon."""
    conditions = ["p.is_deleted = 0", "p.lat IS NOT NULL", "p.lon IS NOT NULL"]
    params = []

    # Bounding box for fast pre-filter
    lat_delta = radius_miles / _MILES_PER_DEG_LAT
    lon_delta = radius_miles / _MILES_PER_DEG_LON
    conditions.append("p.lat BETWEEN ? AND ?")
    params.extend([center_lat - lat_delta, center_lat + lat_delta])
    conditions.append("p.lon BETWEEN ? AND ?")
    params.extend([center_lon - lon_delta, center_lon + lon_delta])

    # Profession filter
    if filters.get("profession_types"):
        placeholders = ",".join("?" for _ in filters["profession_types"])
        conditions.append(f"LOWER(p.profession_name) IN ({placeholders})")
        params.extend(pt.lower() for pt in filters["profession_types"])

    # Training methodology
    if filters.get("training_methodology"):
        conditions.append("LOWER(p.training) LIKE ? ESCAPE '\\'")
        params.append(f"%{_escape_like(filters['training_methodology'].lower())}%")

    # Insurance
    if filters.get("insurance"):
        conditions.append("LOWER(p.insurance_accepted) LIKE ? ESCAPE '\\'")
        params.append(f"%{_escape_like(filters['insurance'].lower())}%")

    where_clause = " AND ".join(conditions)

    # Lawyer deprioritization
    wants_lawyer = any(
        pt.lower() == "lawyer" for pt in filters.get("profession_types", [])
    )
    lawyer_penalty = "" if wants_lawyer else "CASE WHEN p.profession_name = 'Lawyer' THEN 1 ELSE 0 END, "

    # Approximate distance ordering (good enough for ranking, no need for exact Haversine)
    query = f"""
        SELECT p.*,
            ((p.lat - ?) * (p.lat - ?) * {_MILES_PER_DEG_LAT * _MILES_PER_DEG_LAT}
             + (p.lon - ?) * (p.lon - ?) * {_MILES_PER_DEG_LON * _MILES_PER_DEG_LON}) AS dist_sq
        FROM providers p
        WHERE {where_clause}
        ORDER BY {lawyer_penalty}dist_sq ASC
        LIMIT 5
    """
    params_with_dist = [center_lat, center_lat, center_lon, center_lon] + params
    # Reorder: distance params first, then WHERE params
    # Actually, put distance params after WHERE params by restructuring
    final_query = f"""
        SELECT p.*,
            ((p.lat - ?) * (p.lat - ?) * {_MILES_PER_DEG_LAT * _MILES_PER_DEG_LAT}
             + (p.lon - ?) * (p.lon - ?) * {_MILES_PER_DEG_LON * _MILES_PER_DEG_LON}) AS dist_sq
        FROM providers p
        WHERE {where_clause}
        ORDER BY {lawyer_penalty}dist_sq ASC
        LIMIT 5
    """
    final_params = [center_lat, center_lat, center_lon, center_lon] + params
    return final_query, final_params


# ZIP code to lat/lon lookup for common PA zips (precomputed subset)
# In production, this could be a full database table
_ZIP_TO_COORDS: dict[str, tuple[float, float]] = {}


async def _resolve_zip_coords(zip_code: str, db) -> tuple[float, float] | None:
    """Look up approximate lat/lon for a zip code using existing provider data."""
    cursor = await db.execute(
        "SELECT AVG(lat), AVG(lon) FROM providers WHERE zip_code = ? AND lat IS NOT NULL",
        (zip_code,),
    )
    row = await cursor.fetchone()
    if row and row[0] is not None:
        return (row[0], row[1])
    return None


async def search_providers(filters: dict, db=None) -> tuple[list[dict], bool]:
    """Search providers with automatic broadening fallback.

    Returns (providers, broadened) where broadened=True means the strict
    search had no results and filters were relaxed.
    """
    close_db = db is None
    if db is None:
        db = await get_db()
    try:
        location = filters.get("location", {})

        # Try geo-based search if zip code provided
        if location.get("zip"):
            coords = await _resolve_zip_coords(location["zip"], db)
            if coords:
                query, params = _build_geo_query(filters, coords[0], coords[1])
                cursor = await db.execute(query, params)
                rows = await cursor.fetchall()
                if rows:
                    return [_row_to_dict(r) for r in rows], False
                # Widen radius
                query, params = _build_geo_query(filters, coords[0], coords[1], radius_miles=75.0)
                cursor = await db.execute(query, params)
                rows = await cursor.fetchall()
                if rows:
                    return [_row_to_dict(r) for r in rows], True

        # Pass 1: strict search (exact city + age)
        query, params = _build_query(filters)
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        if rows:
            return [_row_to_dict(r) for r in rows], False

        # Pass 2: relax age group, keep city
        query, params = _build_query(filters, relax_age=True)
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        if rows:
            return [_row_to_dict(r) for r in rows], True

        # Pass 3: relax city (state-wide), keep age
        query, params = _build_query(filters, relax_city=True)
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        if rows:
            return [_row_to_dict(r) for r in rows], True

        # Pass 4: relax both city and age
        query, params = _build_query(filters, relax_city=True, relax_age=True)
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [_row_to_dict(r) for r in rows], True

    finally:
        if close_db:
            await db.close()


async def get_all_providers(
    search: str = "",
    status: str = "",
    profession: str = "",
    city: str = "",
    page: int = 1,
    per_page: int = 20,
    include_deleted: bool = False,
) -> tuple[list[dict], int]:
    db = await get_db()
    try:
        conditions = []
        params = []

        if not include_deleted:
            conditions.append("p.is_deleted = 0")

        if status:
            conditions.append("p.verification_status = ?")
            params.append(status)

        if profession:
            conditions.append("LOWER(p.profession_name) = LOWER(?)")
            params.append(profession)

        if city:
            conditions.append("LOWER(p.city) LIKE LOWER(?) ESCAPE '\\'")
            params.append(f"%{_escape_like(city)}%")

        if search:
            conditions.append(
                "(LOWER(p.name) LIKE LOWER(?) ESCAPE '\\' OR LOWER(p.services) LIKE LOWER(?) ESCAPE '\\' OR LOWER(p.training) LIKE LOWER(?) ESCAPE '\\')"
            )
            escaped_search = f"%{_escape_like(search)}%"
            params.extend([escaped_search] * 3)

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        offset = (page - 1) * per_page

        count_query = f"SELECT COUNT(*) FROM providers p WHERE {where_clause}"
        cursor = await db.execute(count_query, params)
        row = await cursor.fetchone()
        total = row[0]

        query = f"""
            SELECT p.* FROM providers p
            WHERE {where_clause}
            ORDER BY p.updated_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        providers = [_row_to_dict(row) for row in rows]
        return providers, total
    finally:
        await db.close()


async def get_provider_by_id(provider_id: str) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM providers WHERE id = ? AND is_deleted = 0", (provider_id,)
        )
        row = await cursor.fetchone()
        if row:
            return _row_to_dict(row)
        return None
    finally:
        await db.close()


def _row_to_dict(row) -> dict:
    d = dict(row)
    # Convert integer booleans
    for field in ["sliding_scale", "ld_adhd_specialty", "learning_difference_support",
                  "adhd_support", "is_deleted"]:
        if field in d:
            d[field] = bool(d[field])
    # Remove computed distance column if present
    d.pop("dist_sq", None)
    return d


def format_provider_context(providers: list[dict], broadened: bool = False) -> str:
    if not providers:
        return "No matching providers found in the directory."

    header = ""
    if broadened:
        header = "NOTE: No exact matches were found. The following are the closest available providers in the directory (filters were broadened). Mention this to the user clearly.\n\n"

    lines = []
    for p in providers:
        parts = [f"- {p['name']}"]
        if p.get("profession_name"):
            parts.append(f"  Type: {p['profession_name'].replace('_', ' ')}")
        if p.get("services"):
            parts.append(f"  Services: {p['services']}")
        if p.get("training"):
            parts.append(f"  Training/Methodology: {p['training']}")
        if p.get("credentials"):
            parts.append(f"  Credentials: {p['credentials']}")

        # Location
        loc_parts = []
        if p.get("city"):
            loc_parts.append(p["city"])
        loc_parts.append(p.get("state_code") or p.get("state", "PA"))
        if p.get("zip_code"):
            loc_parts.append(p["zip_code"])
        parts.append(f"  Location: {', '.join(loc_parts)}")

        # Pricing
        if p.get("price_per_visit"):
            parts.append(f"  Price: {p['price_per_visit']}")
        if p.get("sliding_scale"):
            parts.append("  Sliding scale available")

        # Insurance
        if p.get("insurance_accepted"):
            parts.append(f"  Insurance: {p['insurance_accepted']}")

        # Ages
        if p.get("age_range_served"):
            parts.append(f"  Ages served: {p['age_range_served']}")

        # School-specific
        if p.get("grades_offered"):
            parts.append(f"  Grades: {p['grades_offered']}")

        # Contact
        if p.get("phone"):
            parts.append(f"  Phone: {p['phone']}")
        if p.get("website"):
            parts.append(f"  Website: {p['website']}")

        lines.append("\n".join(parts))

    return header + "\n\n".join(lines)
