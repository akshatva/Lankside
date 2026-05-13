"""create lri scores

Revision ID: 202605120004
Revises: 202605120003
Create Date: 2026-05-12 00:04:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202605120004"
down_revision: str | None = "202605120003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "lri_scores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("document_integrity_score", sa.Float(), nullable=False),
        sa.Column("collaboration_score", sa.Float(), nullable=False),
        sa.Column("financial_consistency_score", sa.Float(), nullable=False),
        sa.Column("overall_score", sa.Float(), nullable=False),
        sa.Column("band", sa.String(length=16), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column(
            "recommendations",
            sa.JSON(),
            server_default=sa.text("'[]'::json"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lri_scores_band"), "lri_scores", ["band"])
    op.create_index(
        op.f("ix_lri_scores_business_id"),
        "lri_scores",
        ["business_id"],
    )
    op.create_index(op.f("ix_lri_scores_created_at"), "lri_scores", ["created_at"])
    op.create_index(op.f("ix_lri_scores_id"), "lri_scores", ["id"])
    op.create_index(
        op.f("ix_lri_scores_overall_score"),
        "lri_scores",
        ["overall_score"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_lri_scores_overall_score"), table_name="lri_scores")
    op.drop_index(op.f("ix_lri_scores_id"), table_name="lri_scores")
    op.drop_index(op.f("ix_lri_scores_created_at"), table_name="lri_scores")
    op.drop_index(op.f("ix_lri_scores_business_id"), table_name="lri_scores")
    op.drop_index(op.f("ix_lri_scores_band"), table_name="lri_scores")
    op.drop_table("lri_scores")
