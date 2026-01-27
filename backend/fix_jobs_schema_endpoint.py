@router.post("/fix-jobs-schema")
async def fix_jobs_schema(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[str] = Depends(get_current_user_optional)
):
    """
    Fix jobs table schema - add missing columns for drafting
    This endpoint adds drafts_created and total_targets columns if they don't exist
    """
    try:
        # Check current columns
        result = await db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
            ORDER BY ordinal_position
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        logger.info(f"Current jobs table columns: {existing_columns}")
        
        changes_made = []
        
        # Add drafts_created column if missing
        if 'drafts_created' not in existing_columns:
            await db.execute(text("""
                ALTER TABLE jobs ADD COLUMN drafts_created INTEGER DEFAULT 0 NOT NULL
            """))
            changes_made.append("Added drafts_created column")
            logger.info("✅ Added drafts_created column")
        else:
            logger.info("ℹ️  drafts_created column already exists")
        
        # Add total_targets column if missing
        if 'total_targets' not in existing_columns:
            await db.execute(text("""
                ALTER TABLE jobs ADD COLUMN total_targets INTEGER NULL
            """))
            changes_made.append("Added total_targets column")
            logger.info("✅ Added total_targets column")
        else:
            logger.info("ℹ️  total_targets column already exists")
        
        # Update existing jobs to have default value
        await db.execute(text("""
            UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL
        """))
        
        # Create index for better performance
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
        
        return {
            "success": True,
            "message": "Jobs schema fix completed successfully",
            "changes_made": changes_made,
            "current_columns": [
                {
                    "name": col[0],
                    "type": col[1], 
                    "nullable": col[2],
                    "default": col[3]
                }
                for col in columns
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error fixing jobs schema: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fix jobs schema: {str(e)}"
        )
