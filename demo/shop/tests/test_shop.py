from shop.checkout import Item, checkout
from shop.render import render_receipt
from shop.tax import get_rate


def test_tax_rate(session):
    assert get_rate("IN", session=session) == 0.1
    assert session.calls[0][1] == {"country": "IN"}


def test_checkout_total(session):
    out = checkout("A1", [Item("mug", 10.0, 2)], "IN", session=session)
    assert out["tax"] == 2.0 and out["total"] == 22.0


def test_receipt_escapes_untrusted_note():
    html = render_receipt("A2", [Item("mug", 5.0, 1)], 0.5, 5.5, note="<script>x</script>")
    assert "<script>" not in html and "&lt;script&gt;" in html


def test_receipt_allows_trusted_em_note():
    html = render_receipt("A3", [Item("mug", 5.0, 1)], 0.5, 5.5, note="<em>Thanks!</em>")
    assert "<em>Thanks!</em>" in html
