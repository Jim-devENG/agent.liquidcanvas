# Simple Fix for Render Shell

## The Problem
`psql $DATABASE_URL` doesn't work because the database is remote, not local.

## The Solution: Use Python Directly

**Type this ONE command in Render shell:**

```python
python3 -c "from sqlalchemy import create_engine, text; import os; db_url = os.getenv('DATABASE_URL'); db_url = db_url.replace('postgresql+asyncpg://', 'postgresql+psycopg2://') if 'asyncpg' in db_url else db_url; engine = create_engine(db_url); conn = engine.connect(); conn.execute(text('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS drafts_created INTEGER NOT NULL DEFAULT 0')); conn.execute(text('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_targets INTEGER')); conn.execute(text('UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL')); conn.commit(); print('✅ SUCCESS: Columns added!'); conn.close(); engine.dispose()"
```

**Or if that's too long, type these 3 Python commands one by one:**

```python
python3
```

Then paste/type this:
```python
from sqlalchemy import create_engine, text
import os
db_url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
engine = create_engine(db_url)
conn = engine.connect()
conn.execute(text('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS drafts_created INTEGER NOT NULL DEFAULT 0'))
conn.execute(text('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_targets INTEGER'))
conn.execute(text('UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL'))
conn.commit()
print('✅ SUCCESS!')
conn.close()
exit()
```

---

## Even Simpler: Use the Script File

If the script file is already in your repo, just:

```bash
cd backend
python3 add_job_columns_direct.py
```

If you need to create the file first, use the `cat` method from the other guide.

