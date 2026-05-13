"""create schemes and scheme matches

Revision ID: 202605120006
Revises: 202605120005
Create Date: 2026-05-13 00:06:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202605120006"
down_revision: str | None = "202605120005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "schemes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("eligibility_summary", sa.Text(), nullable=False),
        sa.Column("benefits_summary", sa.Text(), nullable=False),
        sa.Column("state", sa.String(length=120), nullable=True),
        sa.Column("industry_focus", sa.String(length=160), nullable=False),
        sa.Column("source_url", sa.String(length=1024), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_schemes_category"), "schemes", ["category"])
    op.create_index(op.f("ix_schemes_code"), "schemes", ["code"], unique=True)
    op.create_index(op.f("ix_schemes_id"), "schemes", ["id"])
    op.create_index(op.f("ix_schemes_is_active"), "schemes", ["is_active"])
    op.create_index(op.f("ix_schemes_name"), "schemes", ["name"])
    op.create_index(op.f("ix_schemes_state"), "schemes", ["state"])

    op.create_table(
        "scheme_matches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("scheme_id", sa.Integer(), nullable=False),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("recommendation_status", sa.String(length=32), nullable=False),
        sa.Column("match_reason", sa.Text(), nullable=False),
        sa.Column("eligibility_notes", sa.Text(), nullable=False),
        sa.Column(
            "required_documents",
            sa.JSON(),
            server_default=sa.text("'[]'::json"),
            nullable=False,
        ),
        sa.Column("vector_score", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["scheme_id"], ["schemes.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "business_id",
            "scheme_id",
            name="uq_scheme_match_business_scheme",
        ),
    )
    op.create_index(
        op.f("ix_scheme_matches_business_id"),
        "scheme_matches",
        ["business_id"],
    )
    op.create_index(
        op.f("ix_scheme_matches_created_at"),
        "scheme_matches",
        ["created_at"],
    )
    op.create_index(op.f("ix_scheme_matches_id"), "scheme_matches", ["id"])
    op.create_index(
        op.f("ix_scheme_matches_match_score"),
        "scheme_matches",
        ["match_score"],
    )
    op.create_index(
        op.f("ix_scheme_matches_recommendation_status"),
        "scheme_matches",
        ["recommendation_status"],
    )
    op.create_index(
        op.f("ix_scheme_matches_scheme_id"),
        "scheme_matches",
        ["scheme_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_scheme_matches_scheme_id"), table_name="scheme_matches")
    op.drop_index(
        op.f("ix_scheme_matches_recommendation_status"),
        table_name="scheme_matches",
    )
    op.drop_index(op.f("ix_scheme_matches_match_score"), table_name="scheme_matches")
    op.drop_index(op.f("ix_scheme_matches_id"), table_name="scheme_matches")
    op.drop_index(op.f("ix_scheme_matches_created_at"), table_name="scheme_matches")
    op.drop_index(op.f("ix_scheme_matches_business_id"), table_name="scheme_matches")
    op.drop_table("scheme_matches")
    op.drop_index(op.f("ix_schemes_state"), table_name="schemes")
    op.drop_index(op.f("ix_schemes_name"), table_name="schemes")
    op.drop_index(op.f("ix_schemes_is_active"), table_name="schemes")
    op.drop_index(op.f("ix_schemes_id"), table_name="schemes")
    op.drop_index(op.f("ix_schemes_code"), table_name="schemes")
    op.drop_index(op.f("ix_schemes_category"), table_name="schemes")
    op.drop_table("schemes")
