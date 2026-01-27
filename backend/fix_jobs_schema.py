"""
Fix jobs table schema - add missing columns
Run this script to add drafts_created and total_targets columns
"""
import asyncio
import os
from sqlalchemy import text
from app.db.database import AsyncSessionLocal

async def fix_jobs_schema():
    """Add missing columns to jobs table"""
    async with AsyncSessionLocal() as db:
        try:
            # Check current columns
            result = await db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'jobs' 
                ORDER BY ordinal_position
            """))
            existing_columns = [row[0] for row in result.fetchall()]
            print(f"Current jobs table columns: {existing_columns}")
            
            # Add drafts_created column if missing
            if 'drafts_created' not in existing_columns:
                await db.execute(text("""
                    ALTER TABLE jobs ADD COLUMN drafts_created INTEGER DEFAULT 0 NOT NULL
                """))
                print("✅ Added drafts_created column")
            else:
                print("ℹ️  drafts_created column already exists")
            
            # Add total_targets column if missing
            if 'total_targets' not in existing_columns:
                await db.execute(text("""
                    ALTER TABLE jobs ADD COLUMN total_targets INTEGER NULL
                """))
                print("✅ Added total_targets column")
            else:
                print("ℹ️  total_targets column already exists")
            
            # Update existing jobs
            await db.execute(text("""
                UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL
            """))
            
            # Create index
            await db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_jobs_drafts_created ON jobs(drafts_created)
            """))
            
            await db.commit()
            
            # Verify the fix
            result = await db.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'jobs' 
                ORDER BY ordinal_position
            """))
            columns = result.fetchall()
            print("\n📋 Updated jobs table structure:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
                
            print("\n🎉 Jobs schema fix completed successfully!")
            
        except Exception as e:
            print(f"❌ Error fixing jobs schema: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(fix_jobs_schema())
