"""Add progress tracking columns to jobs table

Revision ID: add_job_progress_columns
Revises: final_schema_repair
Create Date: 2026-01-26 01:15:00.000000

This migration adds:
- drafts_created: Integer column to track number of drafts created (default: 0)
- total_targets: Integer column to track total number of prospects to draft (nullable)

These columns are used for tracking progress in background drafting jobs.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'add_job_progress_columns'
# Use the latest merge point - this migration should work regardless of which head is current
# The migration is idempotent, so it's safe even if columns already exist
down_revision = 'de8b5344821d'  # Chain after merge_all_migration_heads
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add progress tracking columns to jobs table.
    This migration is idempotent - safe to run multiple times.
    """
    conn = op.get_bind()
    
    # Check if columns already exist
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name IN ('drafts_created', 'total_targets')
    """))
    existing_columns = {row[0] for row in result.fetchall()}
    
    # Add drafts_created column if it doesn't exist
    if 'drafts_created' not in existing_columns:
        op.add_column('jobs', 
            sa.Column('drafts_created', sa.Integer(), nullable=False, server_default='0')
        )
        # Backfill existing jobs with default value (server_default handles new rows)
        conn.execute(text("UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL"))
        print("✅ Added drafts_created column to jobs table (backfilled existing rows)")
    else:
        print("ℹ️  drafts_created column already exists, skipping")
    
    # Add total_targets column if it doesn't exist
    if 'total_targets' not in existing_columns:
        op.add_column('jobs', 
            sa.Column('total_targets', sa.Integer(), nullable=True)
        )
        # No backfill needed - column is nullable, existing jobs will have NULL (which is correct)
        print("✅ Added total_targets column to jobs table")
    else:
        print("ℹ️  total_targets column already exists, skipping")


def downgrade() -> None:
    """
    Remove progress tracking columns from jobs table.
    """
    conn = op.get_bind()
    
    # Check if columns exist before dropping
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name IN ('drafts_created', 'total_targets')
    """))
    existing_columns = {row[0] for row in result.fetchall()}
    
    if 'total_targets' in existing_columns:
        op.drop_column('jobs', 'total_targets')
        print("✅ Removed total_targets column from jobs table")
    
    if 'drafts_created' in existing_columns:
        op.drop_column('jobs', 'drafts_created')
        print("✅ Removed drafts_created column from jobs table")

