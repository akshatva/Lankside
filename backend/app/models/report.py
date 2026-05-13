from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BankabilityReport(Base):
    __tablename__ = "bankability_reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    report_type: Mapped[str] = mapped_column(
        String(64),
        default="BANKABILITY_REPORT",
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="GENERATING", index=True)
    summary: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    summary_text: Mapped[str] = mapped_column(Text)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    generated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    business: Mapped["Business"] = relationship(back_populates="reports")
