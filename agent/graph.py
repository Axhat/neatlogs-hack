"""Dependency graph: package -> source files that import it (AST), plus business context from business.yaml."""
import ast
import json
import re
import shutil
import subprocess
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


def build(root, pins, business_path=None):
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
    by = Path(business_path) if business_path else root / "business.yaml"
    if by.exists():
        biz = yaml.safe_load(by.read_text()) or {}
    graph = {}
    for pkg, ver in pins.items():
        feature = (biz.get("packages", {}).get(pkg) or {}).get("feature")
        finfo = (biz.get("features", {}) or {}).get(feature, {})
        graph[pkg] = {"version": ver, "files": pkg_files[pkg], "feature": feature,
                      "revenue_at_risk_per_day_usd": finfo.get("revenue_at_risk_per_day_usd"), "owner": finfo.get("owner"),
                      "parent": (biz.get("packages", {}).get(pkg) or {}).get("parent")}
    return graph


def _import_name(pkg):
    for mod, name in IMPORT_TO_PKG.items():
        if name.lower() == pkg.lower():
            return mod
    return pkg.lower().replace("-", "_")


def entire_files(root, pkg, top_k=8):
    """Ask Entire Graph which source files use a package; keep hits that really import it.

    Returns None if the entire CLI is unavailable so callers can fall back to the AST scan."""
    if not shutil.which("entire"):
        return None
    mod = _import_name(pkg)
    try:
        r = subprocess.run(["entire", "graph", "search", "--query", f"code that imports {mod}", "--repo", str(root),
                            "--format", "json", "--top-k", str(top_k)], capture_output=True, text=True, timeout=120)
        hits = json.loads(r.stdout)["results"]
    except Exception:
        return None
    files = []
    for h in hits:
        f = h["file_path"]
        if f in files or not f.endswith(".py") or "test" in Path(f).parts[0].lower() or Path(f).name.startswith("test_"):
            continue
        if re.search(rf"^\s*(from|import)\s+{re.escape(mod)}\b", (Path(root) / f).read_text(), re.M):
            files.append(f)
    return files


def build_with_entire(root, pins):
    """Same shape as build(), but file lists come from Entire Graph (falls back to the AST scan per package)."""
    g = build(root, pins)
    for pkg in g:
        found = entire_files(root, pkg)
        if found is not None:
            g[pkg]["files"] = found
            g[pkg]["source"] = "entire-graph"
    return g
