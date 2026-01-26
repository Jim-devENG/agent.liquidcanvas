"""add_social_integrations_table

Revision ID: 20250120180000
Revises: add_discovery_query_table
Create Date: 2025-01-20 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250120180000'
down_revision = 'add_discovery_query'  # Chain after add_discovery_query_table migration (revision ID: add_discovery_query)
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create social_integrations table for storing OAuth tokens and connection status.
    
    This table stores encrypted OAuth tokens for Instagram, Facebook, TikTok, and Email (SMTP).
    Tokens are encrypted at rest using Fernet symmetric encryption.
    """
    # Check if table already exists (idempotent)
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'social_integrations' not in existing_tables:
        op.create_table(
            'social_integrations',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('user_id', sa.String(), nullable=False),
            sa.Column('platform', sa.String(), nullable=False),  # instagram | facebook | tiktok | email
            sa.Column('connection_status', sa.String(), nullable=False, server_default='connected'),
            sa.Column('scopes_granted', postgresql.JSONB(), nullable=True),  # Array of granted scopes
            sa.Column('account_id', sa.String(), nullable=True),  # Platform account ID
            sa.Column('page_id', sa.String(), nullable=True),  # Facebook Page ID
            sa.Column('business_id', sa.String(), nullable=True),  # Meta Business Account ID
            sa.Column('access_token', sa.Text(), nullable=True),  # Encrypted access token
            sa.Column('refresh_token', sa.Text(), nullable=True),  # Encrypted refresh token
            sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True),
            # Email-specific fields
            sa.Column('email_address', sa.String(), nullable=True),
            sa.Column('smtp_host', sa.String(), nullable=True),
            sa.Column('smtp_port', sa.Integer(), nullable=True),
            sa.Column('smtp_username', sa.String(), nullable=True),
            sa.Column('smtp_password', sa.Text(), nullable=True),  # Encrypted SMTP password
            # Metadata
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
            sa.Column('platform_metadata', postgresql.JSONB(), nullable=True),  # Platform-specific metadata (renamed from 'metadata' - reserved in SQLAlchemy)
        )
        
        # Create indexes
        op.create_index('ix_social_integrations_id', 'social_integrations', ['id'])
        op.create_index('ix_social_integrations_user_id', 'social_integrations', ['user_id'])
        op.create_index('ix_social_integrations_platform', 'social_integrations', ['platform'])
        op.create_index('ix_social_integrations_connection_status', 'social_integrations', ['connection_status'])
        
        # Unique constraint: one integration per user per platform
        op.create_index(
            'idx_user_platform',
            'social_integrations',
            ['user_id', 'platform'],
            unique=True
        )
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info("✅ Created social_integrations table")


def downgrade() -> None:
    """Drop social_integrations table"""
    op.drop_index('idx_user_platform', table_name='social_integrations')
    op.drop_index('ix_social_integrations_connection_status', table_name='social_integrations')
    op.drop_index('ix_social_integrations_platform', table_name='social_integrations')
    op.drop_index('ix_social_integrations_user_id', table_name='social_integrations')
    op.drop_index('ix_social_integrations_id', table_name='social_integrations')
    op.drop_table('social_integrations')

