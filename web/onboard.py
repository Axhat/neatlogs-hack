"""Buyer onboarding: read-only scan of a public GitHub repo, with suggested (unconfirmed) business context."""
import fnmatch
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import httpx

from agent import graph as depgraph, osv

REPO_RE = re.compile(r"^https://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?/?$")
MAX_KB = 30_000
_HITS = {}  # ip -> [timestamps]


def rate_limited(ip, limit=6, window=3600):
    now = time.time()
    hits = [t for t in _HITS.get(ip, []) if now - t < window]
    if len(hits) >= limit:
        _HITS[ip] = hits
        return True
    _HITS[ip] = hits + [now]
    return False


def parse_codeowners(root):
    for p in (root / "CODEOWNERS", root / ".github" / "CODEOWNERS", root / "docs" / "CODEOWNERS"):
        if p.exists():
            rules = []
            for line in p.read_text(errors="ignore").splitlines():
                line = line.split("#")[0].strip()
                if line:
                    parts = line.split()
                    rules.append((parts[0], parts[1:]))
            return rules
    return []


def owner_for(path, rules):
    hit = None
    for pat, owners in rules:  # last matching rule wins, like GitHub
        p = pat.lstrip("/")
        if fnmatch.fnmatch(path, p) or fnmatch.fnmatch(path, p.rstrip("/") + "/*") or p == "*" or fnmatch.fnmatch(Path(path).name, p):
            hit = owners
    return ", ".join(hit) if hit else None


def suggest_feature(files):
    if not files:
        return "indirect (pulled in by another package)"
    first = Path(files[0])
    return first.parts[0] if len(first.parts) > 1 else first.stem


def scan_repo(url):
    m = REPO_RE.match(url.strip())
    if not m:
        return {"error": "Please paste a public GitHub repo URL like https://github.com/owner/repo"}
    owner, repo = m.group(1), m.group(2)
    try:
        info = httpx.get(f"https://api.github.com/repos/{owner}/{repo}", timeout=20)
    except httpx.HTTPError:
        return {"error": "Could not reach GitHub, try again."}
    if info.status_code != 200:
        return {"error": "Repo not found or not public."}
    meta = info.json()
    if meta.get("size", 0) > MAX_KB:
        return {"error": f"Repo is too large for the free scan ({meta['size'] // 1000} MB)."}
    tmp = Path(tempfile.mkdtemp(prefix="br-scan-"))
    try:
        r = subprocess.run(["git", "clone", "--depth", "1", "-q", f"https://github.com/{owner}/{repo}.git", str(tmp / "r")],
                           capture_output=True, text=True, timeout=60, env={"GIT_TERMINAL_PROMPT": "0", "PATH": "/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin"})
        if r.returncode:
            return {"error": "Could not clone the repo."}
        root = tmp / "r"
        req = next((p for p in [root / "requirements.txt", *sorted(root.glob("*/requirements.txt"))] if p.exists()), None)
        if not req:
            return {"error": "No requirements.txt found. The prototype scans Python requirements files only (npm and Go are on the roadmap).", "repo": f"{owner}/{repo}"}
        text = req.read_text(errors="ignore")
        pins = osv.parse_pins(text)
        loose = [l for l in text.splitlines() if l.strip() and not l.startswith("#") and "==" not in l and not l.startswith("-")]
        findings = osv.scan(text) if pins else []
        g = depgraph.build(root, pins)
        rules = parse_codeowners(root)
        out = []
        for f in findings:
            files = g.get(f["package"], {}).get("files", [])
            out.append({"package": f["package"], "current": f["current"], "fix": f["unconstrained_target"], "advisories": len(f["advisories"]),
                        "examples": f["summaries"][:2], "files": files,
                        "suggested_feature": suggest_feature(files),
                        "suggested_owner": next((o for o in (owner_for(x, rules) for x in files) if o), None)})
        return {"repo": f"{owner}/{repo}", "requirements_file": str(req.relative_to(root)), "pins_scanned": len(pins),
                "unpinned_skipped": len(loose), "has_codeowners": bool(rules), "findings": out,
                "note": "Scan is read-only. Features and owners are suggestions to confirm; revenue is never guessed."}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
