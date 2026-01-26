# Quick Diagnostic - Run This in Render Shell

## Step 1: Run Diagnostic Script

Copy and paste this into Render shell:

```bash
cat > diagnose.py << 'EOF'
from sqlalchemy import create_engine, text
import os

db_url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
engine = create_engine(db_url)
conn = engine.connect()

print("=" * 60)
print("DIAGNOSTIC: Why Drafts Aren't Showing")
print("=" * 60)

# 1. Check columns
result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs' AND column_name IN ('drafts_created', 'total_targets')"))
columns = {row[0] for row in result.fetchall()}
print(f"\n1️⃣ Columns: {columns}")
if 'drafts_created' not in columns or 'total_targets' not in columns:
    print("   ❌ MISSING - Run fix script!")
else:
    print("   ✅ OK")

# 2. Check jobs
result = conn.execute(text("SELECT id, status, error_message FROM jobs WHERE job_type = 'draft' ORDER BY created_at DESC LIMIT 3"))
jobs = result.fetchall()
print(f"\n2️⃣ Drafting jobs: {len(jobs)}")
for j in jobs:
    print(f"   - {j[0]}: {j[1]} (error: {j[2] or 'None'})")

# 3. Check drafts in DB
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE draft_subject IS NOT NULL AND draft_subject != '' AND draft_body IS NOT NULL AND draft_body != ''"))
draft_count = result.scalar()
print(f"\n3️⃣ Prospects with drafts: {draft_count}")

# 4. Check ready to draft
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE verification_status = 'verified' AND contact_email IS NOT NULL AND (source_type = 'website' OR source_type IS NULL)"))
ready = result.scalar()
print(f"\n4️⃣ Prospects ready for drafting: {ready}")

print("\n" + "=" * 60)
conn.close()
engine.dispose()
EOF

python3 diagnose.py
```

## What the Output Tells You

**If columns missing**: Run the fix script again
**If no jobs**: Backend might not be restarted, or "Start Drafting" didn't work
**If jobs failed**: Check the error message
**If no drafts**: Job didn't run or Gemini failed
**If drafts exist but UI empty**: Frontend issue (check browser console)

