import aiosqlite
import os
from app.config import DATABASE_PATH

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
            seed_path = os.path.join(os.path.dirname(schema_path), "seed.sql")
            if os.path.exists(seed_path):
                with open(seed_path) as f:
                    await db.executescript(f.read())
                await db.commit()
    finally:
        await db.close()
