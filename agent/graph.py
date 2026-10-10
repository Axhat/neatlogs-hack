"""Dependency graph: package -> source files that import it (AST), plus business context from business.yaml."""
import ast
from pathlib import Path

import yaml

# import name -> pip name where they differ
IMPORT_TO_PKG = {"jinja2": "Jinja2", "markupsafe": "MarkupSafe", "requests": "requests", "urllib3": "urllib3", "yaml": "PyYAML"}


def imports_of(path: Path):
    try:
        tree = ast.parse(path.read_text())
    except SyntaxError:
        return set()
    mods = set()
    for n in ast.walk(tree):
        if isinstance(n, ast.Import):
            mods |= {a.name.split(".")[0] for a in n.names}
        elif isinstance(n, ast.ImportFrom) and n.module and n.level == 0:
            mods.add(n.module.split(".")[0])
    return mods


def build(root, pins):
    """Return {package: {'version', 'files': [...]}} for pinned packages, plus business info if present."""
    root = Path(root)
    pkg_files = {p: [] for p in pins}
    for f in sorted(root.rglob("*.py")):
        if ".venv" in f.parts or "tests" in f.parts:
            continue
        for mod in imports_of(f):
            pkg = IMPORT_TO_PKG.get(mod, mod)
            if pkg in pkg_files:
                pkg_files[pkg].append(str(f.relative_to(root)))
    biz = {}
    by = root / "business.yaml"
    if by.exists():
        biz = yaml.safe_load(by.read_text()) or {}
    graph = {}
    for pkg, ver in pins.items():
        feature = (biz.get("packages", {}).get(pkg) or {}).get("feature")
        finfo = (biz.get("features", {}) or {}).get(feature, {})
        graph[pkg] = {"version": ver, "files": pkg_files[pkg], "feature": feature,
                      "revenue_at_risk_per_day_usd": finfo.get("revenue_at_risk_per_day_usd"), "owner": finfo.get("owner")}
    return graph
