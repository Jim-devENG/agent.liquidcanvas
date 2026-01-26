from sqlalchemy import create_engine, text
import os

db_url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql+psycopg2://')
engine = create_engine(db_url)
conn = engine.connect()

print("=" * 60)
print("DIAGNOSING: Why No Prospects Ready for Drafting")
print("=" * 60)

# 1. Total prospects
result = conn.execute(text("SELECT COUNT(*) FROM prospects"))
total = result.scalar()
print(f"\n1️⃣ Total prospects: {total}")

# 2. Prospects with contact_email
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE contact_email IS NOT NULL"))
with_email = result.scalar()
print(f"2️⃣ Prospects with email: {with_email}")

# 3. Prospects with verification_status = 'verified'
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE verification_status = 'verified'"))
verified = result.scalar()
print(f"3️⃣ Prospects verified: {verified}")

# 4. Prospects with both email AND verified
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE verification_status = 'verified' AND contact_email IS NOT NULL"))
ready = result.scalar()
print(f"4️⃣ Prospects ready for drafting (verified + email): {ready}")

# 5. Check verification_status distribution
result = conn.execute(text("SELECT verification_status, COUNT(*) FROM prospects GROUP BY verification_status"))
statuses = result.fetchall()
print(f"\n5️⃣ Verification status breakdown:")
for status, count in statuses:
    print(f"   - {status or 'NULL'}: {count}")

# 6. Check source_type distribution
result = conn.execute(text("SELECT source_type, COUNT(*) FROM prospects GROUP BY source_type"))
sources = result.fetchall()
print(f"\n6️⃣ Source type breakdown:")
for source, count in sources:
    print(f"   - {source or 'NULL'}: {count}")

# 7. Sample of prospects without email
result = conn.execute(text("SELECT id, domain, verification_status, contact_email FROM prospects WHERE contact_email IS NULL LIMIT 5"))
no_email = result.fetchall()
print(f"\n7️⃣ Sample prospects WITHOUT email (first 5):")
for row in no_email:
    print(f"   - ID: {row[0]}, Domain: {row[1]}, Status: {row[2]}, Email: {row[3]}")

# 8. Sample of prospects not verified
result = conn.execute(text("SELECT id, domain, verification_status, contact_email FROM prospects WHERE verification_status != 'verified' OR verification_status IS NULL LIMIT 5"))
not_verified = result.fetchall()
print(f"\n8️⃣ Sample prospects NOT verified (first 5):")
for row in not_verified:
    print(f"   - ID: {row[0]}, Domain: {row[1]}, Status: {row[2]}, Email: {row[3] or 'NULL'}")

# 9. Check if there are any prospects with drafts already
result = conn.execute(text("SELECT COUNT(*) FROM prospects WHERE draft_subject IS NOT NULL AND draft_subject != '' AND draft_body IS NOT NULL AND draft_body != ''"))
with_drafts = result.scalar()
print(f"\n9️⃣ Prospects with existing drafts: {with_drafts}")

print("\n" + "=" * 60)
print("DIAGNOSIS COMPLETE")
print("=" * 60)
print("\n💡 To fix:")
print("   - If prospects exist but aren't verified: Run email verification")
print("   - If prospects exist but have no email: Run email scraping")
print("   - If no prospects exist: Run discovery first")

conn.close()
engine.dispose()

