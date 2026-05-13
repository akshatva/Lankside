from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from app.core.config import settings

DEMO_DOCUMENT_TYPES = (
    "GST_CERTIFICATE",
    "UDYAM_CERTIFICATE",
    "PAN_CARD",
    "BANK_STATEMENT",
    "ITR_ACKNOWLEDGEMENT",
)


def build_demo_pdf(
    *,
    business_slug: str,
    document_type: str,
    title: str,
    lines: list[str],
) -> tuple[str, str, int]:
    demo_dir = Path(settings.upload_dir).expanduser() / "demo"
    demo_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"demo_{business_slug}_{document_type.lower()}.pdf"
    file_path = demo_dir / stored_filename

    try:
        _write_pdf(file_path, title, lines)
    except Exception:
        _write_text_pdf_fallback(file_path, title, lines)

    return stored_filename, str(file_path), file_path.stat().st_size


def remove_demo_uploads() -> int:
    demo_dir = Path(settings.upload_dir).expanduser() / "demo"
    if not demo_dir.exists():
        return 0
    deleted = 0
    for path in demo_dir.glob("demo_*"):
        if path.is_file():
            path.unlink()
            deleted += 1
    return deleted


def _write_pdf(file_path: Path, title: str, lines: list[str]) -> None:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    pdf = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4
    y = height - 72
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(72, y, title)
    y -= 32
    pdf.setFont("Helvetica", 10)
    for line in lines:
        for chunk in wrap(line, width=88):
            if y < 72:
                pdf.showPage()
                pdf.setFont("Helvetica", 10)
                y = height - 72
            pdf.drawString(72, y, chunk)
            y -= 16
    pdf.save()


def _write_text_pdf_fallback(file_path: Path, title: str, lines: list[str]) -> None:
    content = "\n".join([title, "DEMO PDF PLACEHOLDER", *lines])
    file_path.write_text(content, encoding="utf-8")
