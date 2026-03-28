import aiosqlite
import logging
import os
from app.config import DATABASE_PATH

logger = logging.getLogger(__name__)

DB_PATH = DATABASE_PATH


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    db = await get_db()
    try:
        schema_path = os.path.join(os.path.dirname(__file__), "..", "..", "database", "schema.sql")
        if not os.path.exists(schema_path):
            schema_path = os.path.join(os.path.dirname(__file__), "..", "database", "schema.sql")
        with open(schema_path) as f:
            await db.executescript(f.read())
        await db.commit()

        # Check if seed data needed
        cursor = await db.execute("SELECT COUNT(*) FROM providers")
        row = await cursor.fetchone()
        if row[0] == 0:
            # Try to import from CSV first
            csv_imported = await _import_csv_seed(db)
            if not csv_imported:
                # Fall back to seed.sql if it exists
                seed_path = os.path.join(os.path.dirname(schema_path), "seed.sql")
                if os.path.exists(seed_path):
                    with open(seed_path) as f:
                        await db.executescript(f.read())
                    await db.commit()

        # Ensure admin user exists
        cursor = await db.execute("SELECT COUNT(*) FROM admin_users")
        row = await cursor.fetchone()
        if row[0] == 0:
            await db.execute(
                "INSERT INTO admin_users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
                (
                    "admin1",
                    "admin@ldapa.org",
                    "$2b$12$UztW.0/LOix.pUQCWUsX6uEhrePdvnDf2WgXr9CZebWSvrr8x8JNS",
                    "LDA of PA Admin",
                ),
            )
            await db.commit()
    finally:
        await db.close()


async def _import_csv_seed(db: aiosqlite.Connection) -> bool:
    """Import providers from the LDAPA directory CSV export if available."""
    from app.services.csv_importer import parse_csv

    # Look for CSV file in project root or database directory
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_candidates = [
        os.path.join(base_dir, f)
        for f in os.listdir(base_dir)
        if f.endswith(".csv") and "export_members" in f.lower()
    ]

    if not csv_candidates:
        return False

    csv_path = csv_candidates[0]
    logger.info("Importing providers from %s", csv_path)

    with open(csv_path, encoding="utf-8-sig") as f:
        content = f.read()

    result = parse_csv(content)
    providers = result["valid"]

    if not providers:
        logger.warning("CSV parsed but no valid providers found. Errors: %s", result["errors"][:10])
        return False

    columns = [
        "id", "first_name", "last_name", "name", "listing_type", "profession_name",
        "services", "training", "credentials", "license",
        "address", "city", "state", "state_code", "zip_code", "lat", "lon",
        "age_range_served", "grades_offered",
        "price_per_visit", "sliding_scale", "insurance_accepted",
        "ld_adhd_specialty", "learning_difference_support", "adhd_support",
        "student_body_type", "total_size", "average_class_size", "religion",
        "phone", "email", "website", "profile_url",
    ]
    placeholders = ", ".join("?" for _ in columns)
    col_names = ", ".join(columns)

    for p in providers:
        values = tuple(p.get(col) for col in columns)
        await db.execute(
            f"INSERT INTO providers ({col_names}) VALUES ({placeholders})",
            values,
        )

    await db.commit()
    logger.info("Imported %d providers (%d warnings, %d errors)",
                len(providers), len(result["warnings"]), len(result["errors"]))
    return True
