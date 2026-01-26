# Step-by-Step Fix for Render Shell

## The Problem
The long one-liner got cut off. Use this step-by-step approach instead.

## Solution: Type These Commands One by One

**Step 1:** Start Python
```python
python3
```

**Step 2:** Type each of these lines (press Enter after each):

```python
from sqlalchemy import create_engine, text
import os
```

```python
db_url = os.getenv('DATABASE_URL')
```

```python
if 'asyncpg' in db_url:
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
```

```python
engine = create_engine(db_url)
```

```python
conn = engine.connect()
```

```python
conn.execute(text('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS drafts_created INTEGER NOT NULL DEFAULT 0'))
```

```python
conn.execute(text('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_targets INTEGER'))
```

```python
conn.execute(text('UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL'))
```

```python
conn.commit()
```

```python
print('✅ SUCCESS: Columns added!')
```

```python
conn.close()
```

```python
exit()
```

---

## Even Simpler: Create a Small Script File

If typing is too much, create a tiny script:

**Type this:**
```bash
cat > fix.py << 'EOF'
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
EOF
```

**Then run it:**
```bash
python3 fix.py
```

---

## If You're Stuck in Python Prompt

If you see `>` and want to exit:
- Press `Ctrl+C` multiple times
- Or type: `exit()`
- Or type: `quit()`

