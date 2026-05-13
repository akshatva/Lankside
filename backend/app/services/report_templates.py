from __future__ import annotations

from typing import Any

from app.schemas.report import BANKABILITY_REPORT_DISCLAIMER


def lri_band_label(band: str | None) -> str:
    if not band:
        return "Not calculated"
    return {
        "GREEN": "GREEN - Strong readiness",
        "YELLOW": "YELLOW - Needs improvement",
        "RED": "RED - High readiness risk",
    }.get(band, band)


def lri_band_color(band: str | None) -> str:
    return {
        "GREEN": "#047857",
        "YELLOW": "#b45309",
        "RED": "#b91c1c",
    }.get(str(band or "").upper(), "#57534e")


def format_score(value: Any) -> str:
    if value is None:
        return "Not calculated"
    try:
        number = float(value)
    except (TypeError, ValueError):
        return str(value)
    return f"{number:g}"


def format_bool(value: bool) -> str:
    return "Available" if value else "Not available"


def escape_pdf_text(value: Any) -> str:
    text = "" if value is None else str(value)
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def disclaimer_text() -> str:
    return BANKABILITY_REPORT_DISCLAIMER


def section_items(items: list[dict[str, Any]], key: str) -> list[str]:
    values = [str(item.get(key)) for item in items if item.get(key)]
    return values or ["No stored records."]
