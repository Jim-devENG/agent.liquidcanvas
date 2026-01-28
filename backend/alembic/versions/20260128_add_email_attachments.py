"""add email attachments table

Revision ID: 20260128_add_email_attachments
Revises: ensure_alembic_version_table
Create Date: 2026-01-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260128_add_email_attachments"
down_revision = "ensure_alembic_version_table"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "email_attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("prospect_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("prospects.id"), nullable=True, index=True),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("scope", sa.String(), nullable=False, server_default="global"),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_email_attachments_prospect_id", "email_attachments", ["prospect_id"])


def downgrade():
    op.drop_index("ix_email_attachments_prospect_id", table_name="email_attachments")
    op.drop_table("email_attachments")
