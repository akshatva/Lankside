from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.report import create_report, update_report
from app.schemas.report import ReportCreate, ReportRead, ReportUpdate
from app.services.report_aggregator import aggregate_bankability_report_data
from app.services.report_templates import (
    disclaimer_text,
    escape_pdf_text,
    format_bool,
    format_score,
    lri_band_color,
    lri_band_label,
)


def generate_bankability_report(db: Session, business_id: int) -> ReportRead:
    report_data = aggregate_bankability_report_data(db, business_id)
    executive_summary = report_data["executive_summary"]["summary_text"]
    report = create_report(
        db,
        ReportCreate(
            business_id=business_id,
            report_type="BANKABILITY_REPORT",
            status="GENERATING",
            summary=report_data,
            summary_text=executive_summary,
        ),
    )

    try:
        pdf_path = generate_report_pdf(report_data, report_id=report.id)
        report = update_report(
            db,
            report,
            ReportUpdate(
                status="GENERATED",
                summary=report_data,
                summary_text=executive_summary,
                pdf_path=pdf_path,
                generated_at=datetime.now(timezone.utc),
            ),
        )
    except Exception:
        update_report(db, report, ReportUpdate(status="FAILED"))
        raise

    return ReportRead.model_validate(report)


def generate_report_pdf(report_data: dict[str, Any], report_id: int | None = None) -> str:
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            PageBreak,
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError as exc:
        raise RuntimeError("ReportLab is required for report PDF export.") from exc

    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.report_output_dir, exist_ok=True)
    output_dir = Path(settings.report_output_dir).expanduser().resolve()
    suffix = f"{report_id}-" if report_id is not None else ""
    file_path = output_dir / f"bankability-report-{suffix}{uuid4().hex}.pdf"

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="LanksideTitle",
            parent=styles["Title"],
            fontSize=24,
            leading=30,
            textColor=colors.HexColor("#17211d"),
            spaceAfter=14,
        ),
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#14532d"),
            spaceBefore=10,
            spaceAfter=8,
        ),
    )
    styles.add(
        ParagraphStyle(
            name="SmallText",
            parent=styles["BodyText"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#57534e"),
        ),
    )

    business = report_data["business_profile"]
    lri = report_data["lri"]
    audit = report_data["audit_findings"]
    documents = report_data["documents"]
    mou = report_data["mou_readiness"]
    grants = report_data["grant_recommendations"]
    executive = report_data["executive_summary"]

    story: list[Any] = [
        Paragraph("Lankside", styles["LanksideTitle"]),
        Paragraph(
            "AI-assisted MSME readiness and documentation summary.",
            styles["Heading2"],
        ),
        Spacer(1, 0.25 * inch),
        _key_value_table(
            [
                ("Business", business["business_name"]),
                ("Generated", report_data["generated_at"]),
                ("LRI Score", format_score(lri["overall_score"])),
                ("LRI Band", lri_band_label(lri["band"])),
            ],
            styles,
        ),
        Spacer(1, 0.25 * inch),
        Paragraph(
            escape_pdf_text(disclaimer_text()),
            styles["BodyText"],
        ),
        PageBreak(),
        Paragraph("Executive Summary", styles["SectionHeading"]),
        Paragraph(escape_pdf_text(executive["summary_text"]), styles["BodyText"]),
        Spacer(1, 8),
    ]
    story.extend(
        _bullet_section("Major Strengths", executive["major_strengths"], styles),
    )
    story.extend(_bullet_section("Major Risks", executive["major_risks"], styles))
    story.extend(
        [
        Paragraph("Business Profile", styles["SectionHeading"]),
        _key_value_table(
            [
                ("Owner", business["owner_name"]),
                ("Industry", business["industry"] or "Not set"),
                ("Location", business["location"] or "Not set"),
                ("Turnover Range", business["turnover_range"] or "Not set"),
                ("Business Age", _age_text(business["business_age_years"])),
                ("GSTIN", format_bool(business["gstin_available"])),
                ("Udyam", format_bool(business["udyam_available"])),
                ("PAN", format_bool(business["pan_available"])),
            ],
            styles,
        ),
        Paragraph("Uploaded Documents Summary", styles["SectionHeading"]),
        _key_value_table(
            [
                ("Uploaded Documents", documents["total_uploaded"]),
                ("Document Types", ", ".join(documents["document_types"]) or "None"),
                (
                    "Average Confidence",
                    format_score(
                        documents["extraction_confidence_overview"][
                            "average_confidence"
                        ],
                    ),
                ),
                (
                    "Low Confidence Items",
                    documents["extraction_confidence_overview"][
                        "low_confidence_count"
                    ],
                ),
            ],
            styles,
        ),
        _document_table(documents["items"], styles),
        PageBreak(),
        Paragraph("Compliance Audit Findings", styles["SectionHeading"]),
        _key_value_table(
            [
                ("Unresolved Findings", audit["total_unresolved"]),
                ("High", audit["by_severity"]["HIGH"]),
                ("Medium", audit["by_severity"]["MEDIUM"]),
                ("Low", audit["by_severity"]["LOW"]),
            ],
            styles,
        ),
        _finding_table(audit["unresolved_risks"], styles),
        Paragraph("LRI Breakdown", styles["SectionHeading"]),
        _lri_table(lri, styles),
        Paragraph("MOU Readiness", styles["SectionHeading"]),
        _key_value_table(
            [
                ("Number of MOUs", mou["mou_count"]),
                (
                    "Cluster Collaboration",
                    mou["cluster_collaboration_readiness"],
                ),
                ("Latest MOU Status", mou["latest_mou_status"] or "No MOU"),
            ],
            styles,
        ),
        Paragraph("Grant Scout Recommendations", styles["SectionHeading"]),
        _grant_table(grants["top_matches"], styles),
        Paragraph("Recommendations & Next Actions", styles["SectionHeading"]),
        _recommendation_table(report_data["recommendations"], styles),
        PageBreak(),
        Paragraph("Disclaimer", styles["SectionHeading"]),
        Paragraph(escape_pdf_text(disclaimer_text()), styles["BodyText"]),
        Spacer(1, 8),
        Paragraph(
            "The report is generated from records stored in Lankside and should "
            "be reviewed independently before any lender, government, or legal "
            "submission. Scheme-fit recommendations are preliminary and must be "
            "checked against official guidelines.",
            styles["BodyText"],
        ),
        ],
    )

    document = SimpleDocTemplate(
        str(file_path),
        pagesize=A4,
        rightMargin=42,
        leftMargin=42,
        topMargin=42,
        bottomMargin=42,
        title="Bankability Report",
    )
    flattened_story: list[Any] = []
    for item in story:
        if isinstance(item, list):
            flattened_story.extend(item)
        else:
            flattened_story.append(item)

    document.build(flattened_story)
    return str(file_path)


def _key_value_table(rows: list[tuple[str, Any]], styles: dict[str, Any]) -> Any:
    from reportlab.lib import colors
    from reportlab.platypus import Paragraph, Table, TableStyle

    data = [
        [
            Paragraph(f"<b>{escape_pdf_text(label)}</b>", styles["BodyText"]),
            Paragraph(escape_pdf_text(value), styles["BodyText"]),
        ]
        for label, value in rows
    ]
    table = Table(data, colWidths=[140, 340])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f5f5f4")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d6d3d1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ],
        ),
    )
    return table


def _bullet_section(title: str, items: list[str], styles: dict[str, Any]) -> list[Any]:
    from reportlab.platypus import Paragraph, Spacer

    story: list[Any] = [Paragraph(title, styles["Heading3"])]
    for item in items:
        story.append(Paragraph(f"- {escape_pdf_text(item)}", styles["BodyText"]))
    story.append(Spacer(1, 8))
    return story


def _document_table(items: list[dict[str, Any]], styles: dict[str, Any]) -> Any:
    rows = [["Type", "Status", "Confidence", "Fields"]]
    for item in items[:12]:
        rows.append(
            [
                item["document_type"],
                item["status"],
                format_score(item["confidence_score"]),
                str(item["extracted_field_count"]),
            ],
        )
    return _simple_table(rows, styles)


def _finding_table(items: list[dict[str, Any]], styles: dict[str, Any]) -> Any:
    rows = [["Severity", "Finding", "Recommendation"]]
    for item in items[:10]:
        rows.append([item["severity"], item["title"], item["recommendation"]])
    if len(rows) == 1:
        rows.append(["-", "No unresolved findings stored.", "-"])
    return _simple_table(rows, styles)


def _lri_table(lri: dict[str, Any], styles: dict[str, Any]) -> Any:
    from reportlab.platypus import TableStyle

    rows = [
        ["Metric", "Score"],
        ["Document Integrity Score", format_score(lri["document_integrity_score"])],
        ["Collaboration Score", format_score(lri["collaboration_score"])],
        ["Financial Consistency Score", format_score(lri["financial_consistency_score"])],
        ["Overall LRI", format_score(lri["overall_score"])],
        ["Band", lri_band_label(lri["band"])],
    ]
    table = _simple_table(rows, styles)
    if lri["band"]:
        table.setStyle(
            TableStyle(
                [
                    (
                        "TEXTCOLOR",
                        (1, -1),
                        (1, -1),
                        lri_band_color(lri["band"]),
                    ),
                ],
            ),
        )
    return table


def _grant_table(items: list[dict[str, Any]], styles: dict[str, Any]) -> Any:
    rows = [["Scheme", "Score", "Benefits", "Fit"]]
    for item in items[:5]:
        rows.append(
            [
                item["scheme_name"],
                format_score(item["match_score"]),
                item["benefits_summary"],
                item["recommendation_status"],
            ],
        )
    if len(rows) == 1:
        rows.append(["-", "No stored matches.", "-", "-"])
    return _simple_table(rows, styles)


def _recommendation_table(items: list[dict[str, str]], styles: dict[str, Any]) -> Any:
    rows = [["Priority", "Next Action"]]
    for item in items:
        rows.append([item["priority"], item["message"]])
    if len(rows) == 1:
        rows.append(["LOW", "Maintain documentation hygiene."])
    return _simple_table(rows, styles)


def _simple_table(rows: list[list[Any]], styles: dict[str, Any]) -> Any:
    from reportlab.lib import colors
    from reportlab.platypus import Paragraph, Table, TableStyle

    data = [
        [Paragraph(escape_pdf_text(cell), styles["SmallText"]) for cell in row]
        for row in rows
    ]
    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17211d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d6d3d1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ],
        ),
    )
    return table


def _age_text(value: Any) -> str:
    if value is None:
        return "Not set"
    return f"{value} year{'s' if value != 1 else ''}"
