"""
Quick diagnostic script to check:
1. If columns were added successfully
2. If any drafting jobs exist
3. If any prospects have drafts
4. What the actual data looks like

Run this in Render shell to diagnose why drafts aren't showing.
"""
from sqlalchemy import create_engine, text
import os

db_url = os.getenv('DATABASE_URL')
if 'asyncpg' in db_url:
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql+psycopg2://')

engine = create_engine(db_url)
conn = engine.connect()

print("=" * 60)
print("DIAGNOSTIC: Why Drafts Aren't Showing")
print("=" * 60)

# 1. Check if columns exist
print("\n1️⃣ Checking if columns exist...")
result = conn.execute(text("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    AND column_name IN ('drafts_created', 'total_targets')
"""))
columns = {row[0] for row in result.fetchall()}
print(f"   ✅ Columns found: {columns}")
if 'drafts_created' not in columns or 'total_targets' not in columns:
    print("   ❌ MISSING COLUMNS - Run the fix script again!")
else:
    print("   ✅ All columns exist")

# 2. Check drafting jobs
print("\n2️⃣ Checking drafting jobs...")
result = conn.execute(text("""
    SELECT id, job_type, status, created_at, error_message
    FROM jobs 
    WHERE job_type = 'draft'
    ORDER BY created_at DESC
    LIMIT 5
"""))
jobs = result.fetchall()
print(f"   Found {len(jobs)} drafting jobs:")
for job in jobs:
    print(f"   - Job {job[0]}: status={job[2]}, created={job[3]}, error={job[4] or 'None'}")

# 3. Check prospects with drafts
print("\n3️⃣ Checking prospects with drafts...")
result = conn.execute(text("""
    SELECT 
        COUNT(*) as total_prospects,
        COUNT(CASE WHEN draft_subject IS NOT NULL AND draft_subject != '' THEN 1 END) as with_subject,
        COUNT(CASE WHEN draft_body IS NOT NULL AND draft_body != '' THEN 1 END) as with_body,
        COUNT(CASE WHEN draft_subject IS NOT NULL AND draft_subject != '' 
                  AND draft_body IS NOT NULL AND draft_body != '' THEN 1 END) as with_both
    FROM prospects
"""))
stats = result.fetchone()
print(f"   Total prospects: {stats[0]}")
print(f"   With draft_subject: {stats[1]}")
print(f"   With draft_body: {stats[2]}")
print(f"   With BOTH (should show in UI): {stats[3]}")

# 4. Check draft-ready prospects (should be drafted)
print("\n4️⃣ Checking draft-ready prospects...")
result = conn.execute(text("""
    SELECT COUNT(*) 
    FROM prospects
    WHERE verification_status = 'verified'
    AND contact_email IS NOT NULL
    AND (source_type = 'website' OR source_type IS NULL)
"""))
ready_count = result.scalar()
print(f"   Prospects ready for drafting: {ready_count}")

# 5. Sample draft data
print("\n5️⃣ Sample draft data (first 3 with drafts)...")
result = conn.execute(text("""
    SELECT id, domain, draft_subject, draft_body, draft_status, verification_status, contact_email
    FROM prospects
    WHERE draft_subject IS NOT NULL AND draft_subject != ''
    AND draft_body IS NOT NULL AND draft_body != ''
    LIMIT 3
"""))
samples = result.fetchall()
if samples:
    for s in samples:
        print(f"   - {s[1]}: subject={s[2][:50] if s[2] else 'None'}..., body={len(s[3]) if s[3] else 0} chars, status={s[4]}")
else:
    print("   ❌ NO DRAFTS FOUND in database!")

# 6. Check latest job status
print("\n6️⃣ Latest drafting job details...")
result = conn.execute(text("""
    SELECT id, status, drafts_created, total_targets, error_message, created_at, updated_at
    FROM jobs
    WHERE job_type = 'draft'
    ORDER BY created_at DESC
    LIMIT 1
"""))
latest_job = result.fetchone()
if latest_job:
    print(f"   Job ID: {latest_job[0]}")
    print(f"   Status: {latest_job[1]}")
    print(f"   Drafts Created: {latest_job[2]}")
    print(f"   Total Targets: {latest_job[3]}")
    print(f"   Error: {latest_job[4] or 'None'}")
    print(f"   Created: {latest_job[5]}")
    print(f"   Updated: {latest_job[6]}")
else:
    print("   ❌ NO DRAFTING JOBS FOUND!")

print("\n" + "=" * 60)
print("DIAGNOSIS COMPLETE")
print("=" * 60)
print("\n💡 What to check:")
print("   - If columns missing: Run fix script again")
print("   - If no jobs: Click 'Start Drafting' in UI")
print("   - If jobs failed: Check error_message above")
print("   - If no drafts: Job may not have run or Gemini failed")
print("   - If drafts exist but not showing: Frontend filter issue")

conn.close()
engine.dispose()

