"""CVE trigger: ask OSV.dev which pinned packages are vulnerable and what version fixes them."""
import re

import httpx
from packaging.version import InvalidVersion, Version

OSV_URL = "https://api.osv.dev/v1/query"


def parse_pins(requirements_text):
    pins = {}
    for line in requirements_text.splitlines():
        m = re.match(r"^\s*([A-Za-z0-9_.\-]+)==([^\s#;]+)", line)
        if m:
            pins[m.group(1)] = m.group(2)
    return pins


def _fixed_versions(vuln):
    for aff in vuln.get("affected", []):
        for rng in aff.get("ranges", []):
            for ev in rng.get("events", []):
                if "fixed" in ev:
                    yield ev["fixed"]


def scan(requirements_text):
    """Return [{package, current, advisories:[ids], target}] for each vulnerable pin."""
    findings = []
    for name, ver in parse_pins(requirements_text).items():
        r = httpx.post(OSV_URL, json={"package": {"name": name, "ecosystem": "PyPI"}, "version": ver}, timeout=30)
        r.raise_for_status()
        vulns = r.json().get("vulns", [])
        if not vulns:
            continue
        fixed = []
        for v in vulns:
            for f in _fixed_versions(v):
                try:
                    fixed.append(Version(f))
                except InvalidVersion:
                    pass
        findings.append({
            "package": name,
            "current": ver,
            "advisories": sorted({v["id"] for v in vulns}),
            "summaries": [v.get("summary", "") for v in vulns][:5],
            "target": str(max(fixed)) if fixed else None,
        })
    return findings
