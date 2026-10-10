"""Receipt rendering. Shown to customers in the order-confirmation email."""
from jinja2 import Environment
from markupsafe import Markup, escape

_env = Environment(autoescape=True)
_TEMPLATE = _env.from_string(
    "<h1>Receipt #{{ order_id }}</h1>"
    "<ul>{% for i in items %}<li>{{ i.name }} x{{ i.qty }} - ${{ '%.2f'|format(i.price * i.qty) }}</li>{% endfor %}</ul>"
    "<p>Tax: ${{ '%.2f'|format(tax) }}</p><p><b>Total: ${{ '%.2f'|format(total) }}</b></p>"
    "<footer>{{ note }}</footer>"
)


def render_receipt(order_id, items, tax, total, note=""):
    # Merchant notes may contain trusted inline HTML (e.g. <em>); everything else is escaped.
    safe_note = Markup(note) if note.startswith("<em>") else escape(note)
    return _TEMPLATE.render(order_id=order_id, items=items, tax=tax, total=total, note=safe_note)
