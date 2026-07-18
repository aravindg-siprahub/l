"""
Timesheet PDF Generator
=======================
Stateless — no database access, no filesystem writes.
Returns raw PDF bytes directly to the caller.

Public API
----------
- derive_timesheet_type(start, end) -> 'Weekly' | 'Monthly'
- build_pdf_filename(candidate_name, start, end) -> str
- generate_timesheet_pdf(timesheet, candidate_name) -> bytes
"""

from __future__ import annotations

import re
import logging
from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, HRFlowable,
)

from app.core.db.models import Timesheet

logger = logging.getLogger(__name__)

# Brand colour (Indigo-600)
BRAND_INDIGO = colors.HexColor("#4F46E5")
LIGHT_GREY   = colors.HexColor("#F4F4F5")
MID_GREY     = colors.HexColor("#A1A1AA")


# ── Helpers ──────────────────────────────────────────────────────────────────

def derive_timesheet_type(start: datetime, end: datetime) -> str:
    """
    Single source of truth for Weekly / Monthly determination.
    Rule: period ≤ 8 days → Weekly, otherwise → Monthly.
    """
    delta = (end.date() if hasattr(end, "date") else end) - (
        start.date() if hasattr(start, "date") else start
    )
    return "Weekly" if delta.days <= 8 else "Monthly"


def _sanitise(value: str) -> str:
    """Remove characters unsafe for filenames; collapse spaces to underscores."""
    return re.sub(r"[^\w]", "_", value).strip("_")


def build_pdf_filename(candidate_name: str, start: datetime, end: datetime) -> str:
    """
    Generate a human-readable PDF filename.
    Example: timesheet_Jane_Doe_2025-07-21_2025-07-27.pdf
    """
    name      = _sanitise(candidate_name)
    start_str = start.strftime("%Y-%m-%d") if hasattr(start, "strftime") else str(start)
    end_str   = end.strftime("%Y-%m-%d")   if hasattr(end,   "strftime") else str(end)
    return f"timesheet_{name}_{start_str}_{end_str}.pdf"


# ── PDF Generator ─────────────────────────────────────────────────────────────

def generate_timesheet_pdf(timesheet: Timesheet, candidate_name: str) -> bytes:
    """
    Build a structured PDF for the given timesheet.
    Returns raw bytes. Never writes to disk or database.

    Raises RuntimeError if ReportLab fails (caller maps this to HTTP 500).
    """
    buffer = BytesIO()
    styles = getSampleStyleSheet()

    # Custom paragraph styles
    title_style = ParagraphStyle(
        "LorvishTitle",
        parent=styles["Title"],
        fontSize=20,
        textColor=BRAND_INDIGO,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "LorvishSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=MID_GREY,
        spaceAfter=12,
    )
    section_style = ParagraphStyle(
        "LorvishSection",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=BRAND_INDIGO,
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = styles["Normal"]
    italic_style = ParagraphStyle(
        "LorvishItalic",
        parent=styles["Italic"],
        fontSize=8,
        textColor=MID_GREY,
    )

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=f"Timesheet — {candidate_name}",
        author="Lorvish Platform",
    )

    # Derived values
    period_type  = derive_timesheet_type(
        timesheet.period_start_date, timesheet.period_end_date
    )
    period_label = (
        f"{timesheet.period_start_date.strftime('%d %b %Y')}"
        f" – "
        f"{timesheet.period_end_date.strftime('%d %b %Y')}"
    )
    generated_on = datetime.utcnow().strftime("%d %b %Y at %H:%M UTC")

    # ── Build flowables ───────────────────────────────────────────────────────
    elements: list = []

    # Header
    elements.append(Paragraph("Lorvish Platform", title_style))
    elements.append(Paragraph("Timesheet Submission", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_INDIGO, spaceAfter=12))

    # Summary table
    elements.append(Paragraph("Summary", section_style))
    summary_data = [
        ["Candidate",    candidate_name],
        ["Period",       period_label],
        ["Type",         period_type],
        ["Total Hours",  f"{timesheet.total_hours}h"],
        ["Status",       "Submitted"],
    ]
    summary_table = Table(summary_data, colWidths=[45 * mm, 120 * mm])
    summary_table.setStyle(TableStyle([
        ("FONTNAME",        (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",        (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE",        (0, 0), (-1, -1), 10),
        ("TEXTCOLOR",       (0, 0), (0, -1), colors.HexColor("#3F3F46")),
        ("TEXTCOLOR",       (1, 0), (1, -1), colors.black),
        ("ROWBACKGROUNDS",  (0, 0), (-1, -1), [colors.white, LIGHT_GREY]),
        ("TOPPADDING",      (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",   (0, 0), (-1, -1), 6),
        ("LEFTPADDING",     (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",    (0, 0), (-1, -1), 8),
        ("GRID",            (0, 0), (-1, -1), 0.5, colors.HexColor("#E4E4E7")),
        ("ROUNDEDCORNERS",  [4, 4, 4, 4]),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # Daily entries
    elements.append(Paragraph("Daily Entries", section_style))

    sorted_entries = sorted(timesheet.entries, key=lambda e: e.date)
    if sorted_entries:
        entry_data = [["Date", "Hours", "Task Description"]]
        for entry in sorted_entries:
            date_str = (
                entry.date.strftime("%a, %d %b %Y")
                if hasattr(entry.date, "strftime") else str(entry.date)
            )
            entry_data.append([date_str, f"{entry.hours_worked}h", entry.task_description])

        col_widths = [38 * mm, 18 * mm, 109 * mm]
        entry_table = Table(entry_data, colWidths=col_widths, repeatRows=1)
        entry_table.setStyle(TableStyle([
            # Header row
            ("BACKGROUND",    (0, 0), (-1, 0), BRAND_INDIGO),
            ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
            ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, 0), 9),
            # Data rows
            ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE",      (0, 1), (-1, -1), 9),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
            # Alignment
            ("ALIGN",         (1, 0), (1, -1), "CENTER"),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            # Padding
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
            # Grid
            ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#E4E4E7")),
            ("LINEBELOW",     (0, 0), (-1, 0), 1.5, BRAND_INDIGO),
        ]))
        elements.append(entry_table)
    else:
        elements.append(
            Paragraph("No daily entries recorded.", body_style)
        )

    # Total hours summary line
    elements.append(Spacer(1, 8))
    total_data = [["", "Total Hours", f"{timesheet.total_hours}h"]]
    total_table = Table(total_data, colWidths=[38 * mm, 18 * mm, 109 * mm])
    total_table.setStyle(TableStyle([
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("ALIGN",         (1, 0), (1, -1), "CENTER"),
        ("ALIGN",         (2, 0), (2, -1), "LEFT"),
        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#EEF2FF")),
        ("TEXTCOLOR",     (0, 0), (-1, -1), BRAND_INDIGO),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("BOX",           (0, 0), (-1, -1), 1, BRAND_INDIGO),
    ]))
    elements.append(total_table)

    # Notes
    if timesheet.notes:
        elements.append(Spacer(1, 14))
        elements.append(Paragraph("Notes", section_style))
        elements.append(Paragraph(timesheet.notes, body_style))

    # Footer
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=MID_GREY))
    elements.append(Spacer(1, 6))
    elements.append(
        Paragraph(f"Generated by Lorvish Platform · {generated_on}", italic_style)
    )

    doc.build(elements)
    return buffer.getvalue()
