"""Checkout: totals an order, applies tax, renders the receipt."""
from dataclasses import dataclass

from .render import render_receipt
from .tax import get_rate


@dataclass
class Item:
    name: str
    price: float
    qty: int


def checkout(order_id, items, country, note="", session=None):
    subtotal = sum(i.price * i.qty for i in items)
    tax = round(subtotal * get_rate(country, session=session), 2)
    total = round(subtotal + tax, 2)
    return {"total": total, "tax": tax, "receipt_html": render_receipt(order_id, items, tax, total, note)}
