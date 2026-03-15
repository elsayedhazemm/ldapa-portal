from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.auth import require_admin
from app.database import get_db
from app.models.provider import ProviderCreate, ProviderUpdate, ProviderResponse
from app.services.provider_search import get_all_providers, get_provider_by_id
from app.services.csv_importer import parse_csv

router = APIRouter(prefix="/api/admin/providers", tags=["providers"])

# Fields that are stored as integer booleans in the DB
_BOOL_FIELDS = {"sliding_scale", "ld_adhd_specialty", "learning_difference_support", "adhd_support"}


def _to_response(p: dict) -> ProviderResponse:
    return ProviderResponse(**p)


@router.get("")
async def list_providers(
    search: str = "",
    status: str = "",
    profession: str = "",
    city: str = "",
    page: int = 1,
    per_page: int = 20,
    _admin: dict = Depends(require_admin),
):
    providers, total = await get_all_providers(search, status, profession, city, page, per_page)
    return {
        "providers": [_to_response(p) for p in providers],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{provider_id}")
async def get_provider(provider_id: str, _admin: dict = Depends(require_admin)):
    provider = await get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return _to_response(provider)


@router.post("")
async def create_provider(data: ProviderCreate, _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        provider_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        dump = data.model_dump()

        columns = list(dump.keys()) + ["id", "created_at", "updated_at"]
        values = []
        for k, v in dump.items():
            if k in _BOOL_FIELDS:
                values.append(int(v) if v else 0)
            else:
                values.append(v)
        values.extend([provider_id, now, now])

        placeholders = ", ".join("?" for _ in columns)
        col_names = ", ".join(columns)

        await db.execute(
            f"INSERT INTO providers ({col_names}) VALUES ({placeholders})",
            tuple(values),
        )
        await db.commit()
        provider = await get_provider_by_id(provider_id)
        return _to_response(provider)
    finally:
        await db.close()


@router.put("/{provider_id}")
async def update_provider(
    provider_id: str, data: ProviderUpdate, _admin: dict = Depends(require_admin)
):
    existing = await get_provider_by_id(provider_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Provider not found")

    db = await get_db()
    try:
        updates = {}
        for field, value in data.model_dump(exclude_unset=True).items():
            if value is not None:
                if field in _BOOL_FIELDS:
                    updates[field] = int(value)
                else:
                    updates[field] = value

        if not updates:
            return _to_response(existing)

        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [provider_id]

        await db.execute(
            f"UPDATE providers SET {set_clause} WHERE id = ?", values
        )
        await db.commit()
        provider = await get_provider_by_id(provider_id)
        return _to_response(provider)
    finally:
        await db.close()


@router.delete("/{provider_id}")
async def delete_provider(provider_id: str, _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        await db.execute(
            "UPDATE providers SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?",
            (provider_id,),
        )
        await db.commit()
        return {"success": True}
    finally:
        await db.close()


@router.patch("/{provider_id}/verify")
async def verify_provider(provider_id: str, _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        await db.execute(
            """UPDATE providers SET verification_status = 'verified',
                last_verified_at = ?, updated_at = ? WHERE id = ?""",
            (now, now, provider_id),
        )
        await db.commit()
        provider = await get_provider_by_id(provider_id)
        return _to_response(provider)
    finally:
        await db.close()


@router.patch("/{provider_id}/archive")
async def archive_provider(provider_id: str, _admin: dict = Depends(require_admin)):
    db = await get_db()
    try:
        await db.execute(
            """UPDATE providers SET verification_status = 'archived',
                updated_at = datetime('now') WHERE id = ?""",
            (provider_id,),
        )
        await db.commit()
        provider = await get_provider_by_id(provider_id)
        return _to_response(provider)
    finally:
        await db.close()


@router.post("/bulk-verify")
async def bulk_verify(body: dict, _admin: dict = Depends(require_admin)):
    ids = body.get("ids", [])
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        for pid in ids:
            await db.execute(
                """UPDATE providers SET verification_status = 'verified',
                    last_verified_at = ?, updated_at = ? WHERE id = ?""",
                (now, now, pid),
            )
        await db.commit()
        return {"success": True, "count": len(ids)}
    finally:
        await db.close()


@router.post("/bulk-archive")
async def bulk_archive(body: dict, _admin: dict = Depends(require_admin)):
    ids = body.get("ids", [])
    db = await get_db()
    try:
        for pid in ids:
            await db.execute(
                """UPDATE providers SET verification_status = 'archived',
                    updated_at = datetime('now') WHERE id = ?""",
                (pid,),
            )
        await db.commit()
        return {"success": True, "count": len(ids)}
    finally:
        await db.close()


@router.post("/import/preview")
async def import_preview(file: UploadFile = File(...), _admin: dict = Depends(require_admin)):
    content = await file.read()
    text = content.decode("utf-8-sig")
    result = parse_csv(text)
    return result


@router.post("/import/confirm")
async def import_confirm(body: dict, _admin: dict = Depends(require_admin)):
    providers = body.get("providers", [])
    db = await get_db()
    try:
        columns = [
            "id", "first_name", "last_name", "name", "listing_type", "profession_name",
            "services", "training", "credentials", "license",
            "address", "city", "state", "state_code", "zip_code", "lat", "lon",
            "age_range_served", "grades_offered",
            "price_per_visit", "sliding_scale", "insurance_accepted",
            "ld_adhd_specialty", "learning_difference_support", "adhd_support",
            "student_body_type", "total_size", "average_class_size", "religion",
            "phone", "email", "website", "profile_url",
            "created_at", "updated_at",
        ]
        placeholders = ", ".join("?" for _ in columns)
        col_names = ", ".join(columns)

        imported = 0
        now = datetime.now(timezone.utc).isoformat()
        for p in providers:
            provider_id = p.get("id") or str(uuid.uuid4())
            values = []
            for col in columns:
                if col == "id":
                    values.append(provider_id)
                elif col in ("created_at", "updated_at"):
                    values.append(now)
                elif col in _BOOL_FIELDS:
                    values.append(int(p.get(col, 0) or 0))
                else:
                    values.append(p.get(col))
            await db.execute(
                f"INSERT INTO providers ({col_names}) VALUES ({placeholders})",
                tuple(values),
            )
            imported += 1
        await db.commit()
        return {"imported": imported, "skipped": len(providers) - imported}
    finally:
        await db.close()
