#!/usr/bin/env python3
"""Quick script to add discovery_query_id column"""
import os
from sqlalchemy import create_engine, text

# Get database URL
db_url = os.getenv('DATABASE_URL')
if db_url.startswith('postgresql+asyncpg://'):
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')
    if '?' in db_url:
        base, query = db_url.split('?', 1)
        params = [p for p in query.split('&') if not p.lower().startswith('pgbouncer=')]
        db_url = f'{base}?{"&".join(params)}' if params else base

engine = create_engine(db_url)
with engine.connect() as conn:
    # Check if exists
    result = conn.execute(text("SELECT 1 FROM information_schema.columns WHERE table_name='prospects' AND column_name='discovery_query_id'"))
    if not result.fetchone():
        print("Adding discovery_query_id column...")
        conn.execute(text("ALTER TABLE prospects ADD COLUMN discovery_query_id UUID"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_prospects_discovery_query_id ON prospects(discovery_query_id)"))
        conn.commit()
        print("✅ SUCCESS: Column added!")
    else:
        print("✅ Column already exists")





