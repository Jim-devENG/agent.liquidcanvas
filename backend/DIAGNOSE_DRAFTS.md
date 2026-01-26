# Diagnose Why Drafts Aren't Showing

## Quick Diagnostic Script

Run this in Render shell to see exactly what's happening:

```bash
cat > check_drafts.py << 'EOF'
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

# 2. Check jobs
result = conn.execute(text("SELECT id, status, error_message FROM jobs WHERE job_type = 'draft' ORDER BY created_at DESC LIMIT 3"))
jobs = result.fetchall()
print(f"\n2️⃣ Drafting jobs: {len(jobs)}")
for j in jobs:
    print(f"   - {j[0]}: {j[1]} (error: {j[2] or 'None'})")

# 3. Check drafts
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE draft_subject IS NOT NULL AND draft_subject != '' AND draft_body IS NOT NULL AND draft_body != ''"))
draft_count = result.scalar()
print(f"\n3️⃣ Prospects with drafts: {draft_count}")

# 4. Check draft-ready
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE verification_status = 'verified' AND contact_email IS NOT NULL AND (source_type = 'website' OR source_type IS NULL)"))
ready = result.scalar()
print(f"\n4️⃣ Prospects ready for drafting: {ready}")

print("\n" + "=" * 60)
conn.close()
engine.dispose()
EOF

python3 check_drafts.py
```

This will show you:
- ✅ If columns exist
- ✅ If jobs were created
- ✅ If drafts exist in database
- ✅ If there are prospects ready to draft

---

## Common Issues & Fixes

### Issue 1: No Drafting Jobs Created
**Symptom**: Diagnostic shows 0 drafting jobs
**Fix**: 
- Check if backend was restarted after adding columns
- Try clicking "Start Drafting" again
- Check backend logs for errors

### Issue 2: Jobs Created But Failed
**Symptom**: Jobs exist but status = "failed"
**Fix**:
- Check `error_message` in diagnostic output
- Common causes:
  - No prospects ready (need verified + email)
  - Gemini API not configured
  - Database connection issues

### Issue 3: Drafts Exist But Not Showing
**Symptom**: Diagnostic shows drafts in DB, but UI shows nothing
**Fix**:
- Check browser console for `🔍 [DRAFTS] Filtered X drafts` message
- Hard refresh browser (Ctrl+Shift+R)
- Check if frontend code was deployed

### Issue 4: No Prospects Ready
**Symptom**: Diagnostic shows 0 prospects ready for drafting
**Fix**:
- Prospects need: `verification_status='verified'` AND `contact_email IS NOT NULL`
- Run verification step first
- Check if prospects have emails

