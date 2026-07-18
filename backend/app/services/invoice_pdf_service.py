"""
Invoice PDF Service — Enterprise-grade PDF engine for invoices.
"""
from __future__ import annotations
import logging
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

logger = logging.getLogger(__name__)

BRAND_INDIGO = colors.HexColor("#4F46E5")
LIGHT_GREY   = colors.HexColor("#F4F4F5")
MID_GREY     = colors.HexColor("#A1A1AA")

def generate_invoice_pdf(context: dict) -> bytes:
    """
    Builds a professional invoice PDF from the hydrated context.
    """
    buffer = BytesIO()
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "LorvishTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=BRAND_INDIGO,
        alignment=TA_CENTER,
        spaceAfter=10,
    )
    
    body_style = styles["Normal"]
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=f"Invoice — {context.get('invoice_number')}"
    )

    elements = []
    
    # Header
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_INDIGO, spaceAfter=20))

    # Meta Info
    meta_data = [
        ["Invoice Number:", context.get("invoice_number", "")],
        ["Date of Issue:", context.get("issued_at", "")],
        ["Due Date:", context.get("due_date", "")],
        ["Billed To:", context.get("client_name", "")],
    ]
    if context.get("billing_contact"):
        meta_data.append(["Contact:", context.get("billing_contact")])
    if context.get("billing_email"):
        meta_data.append(["Email:", context.get("billing_email")])
    if context.get("billing_address"):
        meta_data.append(["Address:", context.get("billing_address")])

    meta_table = Table(meta_data, colWidths=[40*mm, 100*mm], hAlign='LEFT')
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6)
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 20))

    # Summary
    elements.append(Paragraph("Work Summary", styles["Heading2"]))
    elements.append(Paragraph(context.get("work_summary", ""), body_style))
    elements.append(Spacer(1, 20))
    
    # Financials
    currency = context.get('currency', 'USD')
    fin_data = [
        ["Subtotal:", f"{currency} {context.get('subtotal', 0):.2f}"],
        ["Tax Amount:", f"{currency} {context.get('tax_amount', 0):.2f}"],
        ["Total Amount:", f"{currency} {context.get('total_amount', 0):.2f}"]
    ]
    fin_table = Table(fin_data, colWidths=[120*mm, 40*mm], hAlign='RIGHT')
    fin_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GREY),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(fin_table)
    elements.append(Spacer(1, 20))
    
    # Footer Notes
    elements.append(Paragraph("Payment Terms", styles["Heading3"]))
    elements.append(Paragraph(context.get("payment_terms", ""), body_style))
    if context.get("notes"):
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("Notes", styles["Heading3"]))
        elements.append(Paragraph(context.get("notes"), body_style))

    doc.build(elements)
    return buffer.getvalue()
