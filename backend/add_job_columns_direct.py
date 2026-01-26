"""
Direct SQL script to add missing columns to jobs table.
No Alembic required - runs raw SQL directly.

Usage:
    python backend/add_job_columns_direct.py
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

def get_database_url():
    """Get database URL from environment"""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL environment variable not set")
        sys.exit(1)
    return db_url

def add_columns():
    """Add missing columns to jobs table"""
    db_url = get_database_url()
    
    # Create engine (use sync driver for raw SQL)
    # Convert asyncpg URL to psycopg2 if needed
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    elif db_url.startswith("postgresql://"):
        # Already psycopg2 format
        pass
    else:
        print(f"❌ Unsupported database URL format: {db_url[:50]}...")
        sys.exit(1)
    
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            # Check if columns already exist
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'jobs' 
                AND column_name IN ('drafts_created', 'total_targets')
            """)
            result = conn.execute(check_query)
            existing = {row[0] for row in result.fetchall()}
            
            print(f"📊 Existing columns: {existing}")
            
            # Add drafts_created if missing
            if 'drafts_created' not in existing:
                print("➕ Adding drafts_created column...")
                conn.execute(text("""
                    ALTER TABLE jobs 
                    ADD COLUMN drafts_created INTEGER NOT NULL DEFAULT 0
                """))
                # Backfill existing rows
                conn.execute(text("UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL"))
                conn.commit()
                print("✅ Added drafts_created column")
            else:
                print("ℹ️  drafts_created column already exists")
            
            # Add total_targets if missing
            if 'total_targets' not in existing:
                print("➕ Adding total_targets column...")
                conn.execute(text("""
                    ALTER TABLE jobs 
                    ADD COLUMN total_targets INTEGER
                """))
                conn.commit()
                print("✅ Added total_targets column")
            else:
                print("ℹ️  total_targets column already exists")
            
            # Verify columns exist
            verify_query = text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'jobs' 
                AND column_name IN ('drafts_created', 'total_targets')
                ORDER BY column_name
            """)
            verify_result = conn.execute(verify_query)
            print("\n✅ Verification:")
            for row in verify_result:
                print(f"   {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")
            
            print("\n✅ SUCCESS: All columns added successfully!")
            print("💡 You can now restart your backend - drafting should work.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("🔧 Adding missing columns to jobs table...")
    print("📝 This script adds: drafts_created, total_targets")
    print("")
    add_columns()

