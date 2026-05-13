from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text)
    eligibility_summary: Mapped[str] = mapped_column(Text)
    benefits_summary: Mapped[str] = mapped_column(Text)
    state: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    industry_focus: Mapped[str] = mapped_column(String(160), default="general")
    source_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    matches: Mapped[list["SchemeMatch"]] = relationship(
        back_populates="scheme",
        cascade="all, delete-orphan",
    )


class SchemeMatch(Base):
    __tablename__ = "scheme_matches"
    __table_args__ = (
        UniqueConstraint(
            "business_id",
            "scheme_id",
            name="uq_scheme_match_business_scheme",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id"), index=True)
    match_score: Mapped[float] = mapped_column(Float, index=True)
    recommendation_status: Mapped[str] = mapped_column(String(32), index=True)
    match_reason: Mapped[str] = mapped_column(Text)
    eligibility_notes: Mapped[str] = mapped_column(Text)
    required_documents: Mapped[list[str]] = mapped_column(JSON, default=list)
    vector_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )

    business: Mapped["Business"] = relationship(back_populates="scheme_matches")
    scheme: Mapped[Scheme] = relationship(back_populates="matches")
