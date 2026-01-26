"""
Fix missing source_type column and check draft status
"""
from sqlalchemy import create_engine, text
import os

db_url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
engine = create_engine(db_url)
conn = engine.connect()

print("=" * 60)
print("FIXING: Missing source_type column")
print("=" * 60)

# Check if source_type exists
result = conn.execute(text("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'prospects' 
    AND column_name = 'source_type'
"""))
exists = result.fetchone()

if not exists:
    print("\n➕ Adding source_type column...")
    conn.execute(text("ALTER TABLE prospects ADD COLUMN source_type VARCHAR(50)"))
    # Set default for existing rows (legacy = website)
    conn.execute(text("UPDATE prospects SET source_type = 'website' WHERE source_type IS NULL"))
    conn.commit()
    print("✅ Added source_type column (existing rows set to 'website')")
else:
    print("\n✅ source_type column already exists")

# Now check draft-ready prospects (without source_type filter first)
print("\n📊 Checking prospects ready for drafting...")
result = conn.execute(text("""
    SELECT COUNT(*) 
    FROM prospects
    WHERE verification_status = 'verified'
    AND contact_email IS NOT NULL
"""))
ready = result.scalar()
print(f"   Prospects ready: {ready}")

# Check drafts
result = conn.execute(text("""
    SELECT COUNT(*) 
    FROM prospects
    WHERE draft_subject IS NOT NULL AND draft_subject != ''
    AND draft_body IS NOT NULL AND draft_body != ''
"""))
drafts = result.scalar()
print(f"   Prospects with drafts: {drafts}")

# Check jobs
result = conn.execute(text("""
    SELECT id, status, error_message, created_at
    FROM jobs
    WHERE job_type = 'draft'
    ORDER BY created_at DESC
    LIMIT 3
"""))
jobs = result.fetchall()
print(f"\n📋 Drafting jobs: {len(jobs)}")
for j in jobs:
    print(f"   - {j[0]}: {j[1]} (error: {j[2] or 'None'}, created: {j[3]})")

print("\n" + "=" * 60)
print("✅ FIX COMPLETE")
print("=" * 60)
print("\n💡 Next steps:")
print("   1. Restart your backend on Render")
print("   2. Click 'Start Drafting' in the UI")
print("   3. Check if drafts appear")

conn.close()
engine.dispose()

