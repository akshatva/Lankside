from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MOU(Base):
    __tablename__ = "mous"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    party_a_name: Mapped[str] = mapped_column(String(255))
    party_b_name: Mapped[str] = mapped_column(String(255))
    purpose: Mapped[str] = mapped_column(Text)
    duration_months: Mapped[int] = mapped_column(Integer)
    contribution_details: Mapped[str] = mapped_column(Text)
    revenue_sharing: Mapped[str] = mapped_column(Text)
    dispute_resolution: Mapped[str] = mapped_column(Text)
    cluster_purpose: Mapped[str] = mapped_column(Text)
    draft_text: Mapped[str] = mapped_column(Text)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32),
        default="GENERATED",
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

    business: Mapped["Business"] = relationship(back_populates="mous")
