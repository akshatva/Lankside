"""create mous

Revision ID: 202605120005
Revises: 202605120004
Create Date: 2026-05-12 00:05:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202605120005"
down_revision: str | None = "202605120004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "mous",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("party_a_name", sa.String(length=255), nullable=False),
        sa.Column("party_b_name", sa.String(length=255), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("duration_months", sa.Integer(), nullable=False),
        sa.Column("contribution_details", sa.Text(), nullable=False),
        sa.Column("revenue_sharing", sa.Text(), nullable=False),
        sa.Column("dispute_resolution", sa.Text(), nullable=False),
        sa.Column("cluster_purpose", sa.Text(), nullable=False),
        sa.Column("draft_text", sa.Text(), nullable=False),
        sa.Column("pdf_path", sa.String(length=1024), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mous_business_id"), "mous", ["business_id"])
    op.create_index(op.f("ix_mous_id"), "mous", ["id"])
    op.create_index(op.f("ix_mous_status"), "mous", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_mous_status"), table_name="mous")
    op.drop_index(op.f("ix_mous_id"), table_name="mous")
    op.drop_index(op.f("ix_mous_business_id"), table_name="mous")
    op.drop_table("mous")
