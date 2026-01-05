"""Add real-time scraping fields to prospects

Revision ID: add_realtime_scraping_fields
Revises: 
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_realtime_scraping_fields'
down_revision = 'add_social_columns'  # Chain after social columns migration
branch_labels = None
depends_on = None


def upgrade():
    # Add bio_text field for social profiles
    op.add_column('prospects', sa.Column('bio_text', sa.Text(), nullable=True))
    
    # Add external_links JSON field for link-in-bio URLs
    op.add_column('prospects', sa.Column('external_links', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Add scraped_at timestamp
    op.add_column('prospects', sa.Column('scraped_at', sa.DateTime(timezone=True), nullable=True))
    
    # Update scrape_status to support more granular states
    # Values: pending, scraping, complete, failed (in addition to existing DISCOVERED, SCRAPED, etc.)
    # This is already a String column, so no migration needed, just documentation


def downgrade():
    op.drop_column('prospects', 'scraped_at')
    op.drop_column('prospects', 'external_links')
    op.drop_column('prospects', 'bio_text')

