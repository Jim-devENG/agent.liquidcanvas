"""Merge job progress columns and social metadata migrations

Revision ID: merge_job_progress_social
Revises: ('20250120190000', 'add_job_progress_columns')
Create Date: 2026-01-26 02:00:00.000000

This migration merges two parallel branches:
- 20250120190000: Renamed metadata to platform_metadata in social_integrations
- add_job_progress_columns: Added drafts_created and total_targets to jobs table

After this merge, there will be a single head revision.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_job_progress_social'
down_revision = ('20250120190000', 'add_job_progress_columns')  # Merge both branches
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Merge migration - no schema changes needed.
    Both branches have already applied their changes.
    This just creates a single head for future migrations.
    """
    # No-op migration - just merges the branches
    pass


def downgrade() -> None:
    """
    Downgrade - no-op since this is just a merge point.
    """
    pass

