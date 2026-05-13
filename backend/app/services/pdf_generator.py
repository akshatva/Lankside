from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.models.mou import MOU
from app.services.mou_generator import LEGAL_REVIEW_DISCLAIMER


def generate_mou_pdf(mou: MOU) -> str:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    except ImportError as exc:
        raise RuntimeError("ReportLab is required for PDF export.") from exc

    output_dir = Path(settings.mou_pdf_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / f"mou-{mou.id}-{uuid4().hex}.pdf"

    styles = getSampleStyleSheet()
    story = [
        Paragraph("Memorandum of Understanding", styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"Party A: {mou.party_a_name}", styles["Normal"]),
        Paragraph(f"Party B: {mou.party_b_name}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph(f"<b>Disclaimer:</b> {LEGAL_REVIEW_DISCLAIMER}", styles["Normal"]),
        Spacer(1, 16),
    ]

    for block in _split_blocks(mou.draft_text):
        if block.startswith("# "):
            story.append(Paragraph(_escape(block[2:]), styles["Title"]))
        elif block.startswith("## "):
            story.append(Paragraph(_escape(block[3:]), styles["Heading2"]))
        else:
            story.append(Paragraph(_escape(block).replace("\n", "<br/>"), styles["BodyText"]))
        story.append(Spacer(1, 8))

    document = SimpleDocTemplate(
        str(file_path),
        pagesize=A4,
        rightMargin=48,
        leftMargin=48,
        topMargin=48,
        bottomMargin=48,
        title="Memorandum of Understanding",
    )
    document.build(story)
    return str(file_path)


def _split_blocks(text: str) -> list[str]:
    blocks = [block.strip() for block in text.split("\n\n")]
    return [block for block in blocks if block]


def _escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
