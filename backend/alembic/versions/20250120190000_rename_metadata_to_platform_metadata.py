"""rename_metadata_to_platform_metadata

Revision ID: 20250120190000
Revises: 20250120180000
Create Date: 2025-01-20 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250120190000'
down_revision = '20250120180000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Rename 'metadata' column to 'platform_metadata' in social_integrations table.
    'metadata' is reserved in SQLAlchemy Declarative API.
    """
    # Check if column exists before renaming
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Check if table exists
    if 'social_integrations' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('social_integrations')]
        
        # Only rename if 'metadata' exists and 'platform_metadata' doesn't
        if 'metadata' in columns and 'platform_metadata' not in columns:
            op.alter_column(
                'social_integrations',
                'metadata',
                new_column_name='platform_metadata',
                existing_type=postgresql.JSONB(),
                existing_nullable=True
            )
            import logging
            logger = logging.getLogger(__name__)
            logger.info("✅ Renamed 'metadata' to 'platform_metadata' in social_integrations table")


def downgrade() -> None:
    """Rename 'platform_metadata' back to 'metadata'"""
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    
    if 'social_integrations' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('social_integrations')]
        
        if 'platform_metadata' in columns and 'metadata' not in columns:
            op.alter_column(
                'social_integrations',
                'platform_metadata',
                new_column_name='metadata',
                existing_type=postgresql.JSONB(),
                existing_nullable=True
            )

