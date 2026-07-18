"""
Finance Calculation Engine — Core reusable calculation logic.

This module encapsulates all financial calculations (subtotals, taxes, formatting)
and ensures logic is never duplicated across the platform.
"""

from decimal import Decimal, ROUND_HALF_UP

def calculate_invoice_totals(total_hours: float, hourly_rate: float, tax_rate: float) -> dict:
    """
    Calculates subtotal, tax_amount, and total_amount using Decimal for precision.
    Returns standard float dict to interface cleanly with ORM models.
    """
    hours_dec = Decimal(str(total_hours))
    rate_dec = Decimal(str(hourly_rate))
    tax_dec = Decimal(str(tax_rate))

    subtotal = (hours_dec * rate_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tax_amount = (subtotal * tax_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total_amount = subtotal + tax_amount

    return {
        "subtotal": float(subtotal),
        "tax_amount": float(tax_amount),
        "total_amount": float(total_amount)
    }

def format_currency(amount: float, currency_code: str = "USD") -> str:
    """
    Format amount as currency string.
    """
    prefix = "$" if currency_code == "USD" else f"{currency_code} "
    return f"{prefix}{amount:,.2f}"
