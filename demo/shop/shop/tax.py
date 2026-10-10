"""Tax-rate lookup against the (internal) tax service."""
import requests

TAX_URL = "https://tax.internal.example/rates"


def get_rate(country, session=None):
    s = session or requests.Session()
    resp = s.get(TAX_URL, params={"country": country}, timeout=5)
    resp.raise_for_status()
    return float(resp.json()["rate"])
