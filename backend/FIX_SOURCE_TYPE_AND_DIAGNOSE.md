# Fix source_type Column and Diagnose Drafts Issue

## Step 1: Add Missing source_type Column

Run this in Render shell:

```bash
cat > fix_source_type.py << 'EOF'
from sqlalchemy import create_engine, text
import os

db_url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
engine = create_engine(db_url)
conn = engine.connect()

print("=" * 60)
print("FIXING: Missing source_type column")
print("=" * 60)

# Check if source_type exists
result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'source_type'"))
exists = result.fetchone()

if not exists:
    print("\n➕ Adding source_type column...")
    conn.execute(text("ALTER TABLE prospects ADD COLUMN source_type VARCHAR(50)"))
    conn.execute(text("UPDATE prospects SET source_type = 'website' WHERE source_type IS NULL"))
    conn.commit()
    print("✅ Added source_type column (existing rows = 'website')")
else:
    print("\n✅ source_type already exists")

# Check ready prospects (without source_type filter)
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE verification_status = 'verified' AND contact_email IS NOT NULL"))
ready = result.scalar()
print(f"\n📊 Prospects ready for drafting: {ready}")

# Check drafts
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE draft_subject IS NOT NULL AND draft_subject != '' AND draft_body IS NOT NULL AND draft_body != ''"))
drafts = result.scalar()
print(f"📝 Prospects with drafts: {drafts}")

# Check jobs
result = conn.execute(text("SELECT id, status, error_message, created_at FROM jobs WHERE job_type = 'draft' ORDER BY created_at DESC LIMIT 3"))
jobs = result.fetchall()
print(f"\n📋 Drafting jobs: {len(jobs)}")
for j in jobs:
    print(f"   - {j[0]}: {j[1]} (error: {j[2] or 'None'})")

print("\n✅ FIX COMPLETE")
print("\n💡 Next: Restart backend, then click 'Start Drafting'")
conn.close()
engine.dispose()
EOF

python3 fix_source_type.py
```

## Step 2: After Fix, Restart Backend

1. Go to Render dashboard
2. Find your backend service
3. Click "Manual Deploy" or restart

## Step 3: Try Drafting Again

1. Go to your app
2. Click "Start Drafting"
3. Check if drafts appear

## What This Fixes

- ✅ Adds missing `source_type` column
- ✅ Sets existing rows to `'website'` (legacy)
- ✅ Allows drafting queries to work
- ✅ Shows diagnostic info about ready prospects and drafts

