"""create audit findings

Revision ID: 202605120003
Revises: 202605120002
Create Date: 2026-05-12 00:03:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202605120003"
down_revision: str | None = "202605120002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "audit_findings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=True),
        sa.Column("finding_type", sa.String(length=80), nullable=False),
        sa.Column("severity", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=False),
        sa.Column("field_name", sa.String(length=120), nullable=True),
        sa.Column("expected_value", sa.Text(), nullable=True),
        sa.Column("actual_value", sa.Text(), nullable=True),
        sa.Column(
            "is_resolved",
            sa.Boolean(),
            server_default=sa.text("false"),
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
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_audit_findings_business_id"),
        "audit_findings",
        ["business_id"],
    )
    op.create_index(
        op.f("ix_audit_findings_document_id"),
        "audit_findings",
        ["document_id"],
    )
    op.create_index(
        op.f("ix_audit_findings_finding_type"),
        "audit_findings",
        ["finding_type"],
    )
    op.create_index(op.f("ix_audit_findings_id"), "audit_findings", ["id"])
    op.create_index(
        op.f("ix_audit_findings_is_resolved"),
        "audit_findings",
        ["is_resolved"],
    )
    op.create_index(
        op.f("ix_audit_findings_severity"),
        "audit_findings",
        ["severity"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_findings_severity"), table_name="audit_findings")
    op.drop_index(op.f("ix_audit_findings_is_resolved"), table_name="audit_findings")
    op.drop_index(op.f("ix_audit_findings_id"), table_name="audit_findings")
    op.drop_index(op.f("ix_audit_findings_finding_type"), table_name="audit_findings")
    op.drop_index(op.f("ix_audit_findings_document_id"), table_name="audit_findings")
    op.drop_index(op.f("ix_audit_findings_business_id"), table_name="audit_findings")
    op.drop_table("audit_findings")
