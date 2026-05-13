from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    business_name: Mapped[str] = mapped_column(String(255), index=True)
    owner_name: Mapped[str] = mapped_column(String(255))
    udyam_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    pan: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    industry_type: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    business_age_years: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    turnover_range: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="businesses")
    documents: Mapped[list["Document"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )
    audit_findings: Mapped[list["AuditFinding"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )
    lri_scores: Mapped[list["LRIScore"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )
    mous: Mapped[list["MOU"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )
    scheme_matches: Mapped[list["SchemeMatch"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )
    reports: Mapped[list["BankabilityReport"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )
