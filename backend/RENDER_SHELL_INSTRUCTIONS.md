# How to Run Script in Render Shell (When Paste Doesn't Work)

## Option 1: Use Git (Easiest - Recommended)

Since the script is already in your codebase, just pull it:

```bash
# In Render shell
cd backend
git pull origin main
python add_job_columns_direct.py
```

---

## Option 2: Create File with cat (Heredoc)

Copy this ENTIRE block and paste into Render shell:

```bash
cat > add_job_columns_direct.py << 'ENDOFFILE'
import os
import sys
from sqlalchemy import create_engine, text

def get_database_url():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not set")
        sys.exit(1)
    return db_url

def add_columns():
    db_url = get_database_url()
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    
    engine = create_engine(db_url)
    try:
        with engine.connect() as conn:
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'jobs' 
                AND column_name IN ('drafts_created', 'total_targets')
            """)
            result = conn.execute(check_query)
            existing = {row[0] for row in result.fetchall()}
            print(f"📊 Existing columns: {existing}")
            
            if 'drafts_created' not in existing:
                print("➕ Adding drafts_created...")
                conn.execute(text("ALTER TABLE jobs ADD COLUMN drafts_created INTEGER NOT NULL DEFAULT 0"))
                conn.execute(text("UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL"))
                conn.commit()
                print("✅ Added drafts_created")
            else:
                print("ℹ️  drafts_created exists")
            
            if 'total_targets' not in existing:
                print("➕ Adding total_targets...")
                conn.execute(text("ALTER TABLE jobs ADD COLUMN total_targets INTEGER"))
                conn.commit()
                print("✅ Added total_targets")
            else:
                print("ℹ️  total_targets exists")
            
            verify_query = text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'jobs' 
                AND column_name IN ('drafts_created', 'total_targets')
            """)
            verify_result = conn.execute(verify_query)
            print("\n✅ Verification:")
            for row in verify_result:
                print(f"   {row[0]}: {row[1]}")
            
            print("\n✅ SUCCESS!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("🔧 Adding missing columns...")
    add_columns()
ENDOFFILE
```

Then run:
```bash
python add_job_columns_direct.py
```

---

## Option 3: Direct SQL (Simplest - No Python)

If paste still doesn't work, run SQL directly:

```bash
# Connect to database
psql $DATABASE_URL

# Then run these SQL commands:
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS drafts_created INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_targets INTEGER;
UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL;

# Verify:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name IN ('drafts_created', 'total_targets');

# Exit psql:
\q
```

---

## Option 4: Use Python One-Liner

If you can type (but not paste), try this shorter version:

```python
python3 << 'EOF'
import os
from sqlalchemy import create_engine, text
db_url = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql+psycopg2://")
engine = create_engine(db_url)
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS drafts_created INTEGER NOT NULL DEFAULT 0"))
    conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_targets INTEGER"))
    conn.execute(text("UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL"))
    conn.commit()
    print("✅ Columns added!")
engine.dispose()
EOF
```

---

## Troubleshooting Paste Issues

**If paste doesn't work in Render shell:**
1. Try right-click → Paste (instead of Ctrl+V)
2. Try Ctrl+Shift+V (Linux-style paste)
3. Use Option 3 (Direct SQL) - shortest commands
4. Use Option 1 (Git pull) - easiest if you've pushed the file

**Quickest solution**: Use Option 3 (Direct SQL) - just 3 commands!

