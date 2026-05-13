"""create bankability reports

Revision ID: 202605120007
Revises: 202605120006
Create Date: 2026-05-13 00:07:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202605120007"
down_revision: str | None = "202605120006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "bankability_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("report_type", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "summary",
            sa.JSON(),
            server_default=sa.text("'{}'::json"),
            nullable=False,
        ),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("pdf_path", sa.String(length=1024), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index(
        op.f("ix_bankability_reports_business_id"),
        "bankability_reports",
        ["business_id"],
    )
    op.create_index(
        op.f("ix_bankability_reports_generated_at"),
        "bankability_reports",
        ["generated_at"],
    )
    op.create_index(op.f("ix_bankability_reports_id"), "bankability_reports", ["id"])
    op.create_index(
        op.f("ix_bankability_reports_report_type"),
        "bankability_reports",
        ["report_type"],
    )
    op.create_index(
        op.f("ix_bankability_reports_status"),
        "bankability_reports",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_bankability_reports_status"), table_name="bankability_reports")
    op.drop_index(
        op.f("ix_bankability_reports_report_type"),
        table_name="bankability_reports",
    )
    op.drop_index(op.f("ix_bankability_reports_id"), table_name="bankability_reports")
    op.drop_index(
        op.f("ix_bankability_reports_generated_at"),
        table_name="bankability_reports",
    )
    op.drop_index(
        op.f("ix_bankability_reports_business_id"),
        table_name="bankability_reports",
    )
    op.drop_table("bankability_reports")
