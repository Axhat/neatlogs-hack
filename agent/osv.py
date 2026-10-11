"""CVE trigger: ask OSV.dev which pinned packages are vulnerable and what version fixes them."""
import re

import httpx
from packaging.specifiers import InvalidSpecifier, SpecifierSet
from packaging.version import InvalidVersion, Version

OSV_URL = "https://api.osv.dev/v1/query"
PYPI_URL = "https://pypi.org/pypi/{name}/json"


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


def _vuln_count(name, version):
    r = httpx.post(OSV_URL, json={"package": {"name": name, "ecosystem": "PyPI"}, "version": version}, timeout=30)
    r.raise_for_status()
    return len(r.json().get("vulns", []))


def safe_target(name, current, lowest_fix, python_version=None, tries=6):
    """Smallest upgrade with no known advisories that the project's Python can install.

    Starts at the lowest version that fixes the advisories, walks up through releases whose
    requires_python admits `python_version`, and returns (version, advisories_left, constrained).
    If no compatible release is clean, returns the compatible release with the fewest advisories."""
    try:
        rel = httpx.get(PYPI_URL.format(name=name), timeout=30).json()["releases"]
    except Exception:
        return (str(lowest_fix) if lowest_fix else None), None, False
    py = Version(python_version) if python_version else None
    cands = []
    for v, files in rel.items():
        try:
            ver = Version(v)
        except InvalidVersion:
            continue
        if ver.is_prerelease or ver <= Version(current) or not files or all(f.get("yanked") for f in files):
            continue
        rp = next((f.get("requires_python") for f in files if f.get("requires_python")), None)
        if rp and py:
            try:
                if py not in SpecifierSet(rp):
                    continue
            except InvalidSpecifier:
                pass
        cands.append(ver)
    cands.sort()
    up = [c for c in cands if lowest_fix is None or c >= lowest_fix]
    for c in up[:tries]:
        if _vuln_count(name, str(c)) == 0:
            return str(c), 0, lowest_fix is not None and c != lowest_fix
    pool = (up[:tries] or []) + cands[-tries:]
    scored = sorted({(_vuln_count(name, str(c)), -i, str(c)) for i, c in enumerate(pool)})
    if scored:
        return scored[0][2], scored[0][0], True
    return None, None, True


def scan(requirements_text, python_version=None):
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
            "unconstrained_target": str(max(fixed)) if fixed else None,
        })
        if fixed:
            tgt, left, constrained = safe_target(name, ver, max(fixed), python_version)
            findings[-1].update({"target": tgt, "advisories_left_at_target": left, "python_constrained": constrained})
        else:
            findings[-1]["target"] = None
    return findings
