"""Blast Radius dashboard: the dependency graph in business terms, for non-engineers."""
import json
import time
from pathlib import Path

import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

from agent import graph as depgraph, osv  # noqa: E402
from web import onboard  # noqa: E402

app = FastAPI(title="Blast Radius")
SRC = {"before": ROOT / "demo/shop", "after": ROOT / "demo/shop_after"}  # after = snapshot of the agent-fixed shop

_CACHE = {}


def cached_scan(reqs, ttl=600):
    """OSV lookups are cached so a public page does not hit the API on every view."""
    hit = _CACHE.get(reqs)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    res = osv.scan(reqs)
    _CACHE[reqs] = (time.time(), res)
    return res


def snapshot(state):
    root = SRC.get(state, SRC["before"])
    if not root.exists():
        root = SRC["before"]
    reqs = (root / "requirements.txt").read_text()
    pins = osv.parse_pins(reqs)
    g = depgraph.build(root, pins, business_path=SRC["before"] / "business.yaml")
    vulns = {f["package"]: f for f in cached_scan(reqs)}
    biz = yaml.safe_load((SRC["before"] / "business.yaml").read_text())
    nodes, edges, findings = [{"data": {"id": "app", "label": biz["company"].split(" (")[0], "kind": "app"}}], [], []
    for fid, feat in biz["features"].items():
        nodes.append({"data": {"id": f"f:{fid}", "label": fid, "kind": "feature", "sub": f"${feat['revenue_at_risk_per_day_usd']:,}/day"}})
        edges.append({"data": {"source": "app", "target": f"f:{fid}"}})
    for pkg, info in g.items():
        v = vulns.get(pkg)
        nodes.append({"data": {"id": f"p:{pkg}", "label": f"{pkg} {info['version']}", "kind": "package",
                               "status": "vulnerable" if v else "ok", "sub": f"{len(v['advisories'])} advisories" if v else "no known issues"}})
        if info["feature"]:
            edges.append({"data": {"source": f"f:{info['feature']}", "target": f"p:{pkg}"}})
        if info.get("parent"):
            edges.append({"data": {"source": f"p:{info['parent']}", "target": f"p:{pkg}"}})
        if v:
            parent = g.get(info.get("parent") or "", {})
            info = {**info, "feature": info["feature"] or parent.get("feature"), "owner": info["owner"] or parent.get("owner"),
                    "revenue_at_risk_per_day_usd": info["revenue_at_risk_per_day_usd"] or parent.get("revenue_at_risk_per_day_usd")} if info.get("parent") else info
            rev = info["revenue_at_risk_per_day_usd"]
            findings.append({
                "package": pkg, "version": info["version"], "target": v["target"], "advisories": len(v["advisories"]),
                "feature": (info["feature"] + (f" (via {info['parent']})" if info.get("parent") else "")) if info["feature"] else "indirect", "owner": info["owner"] or "Engineering",
                "revenue_at_risk_per_day_usd": rev, "files": info["files"], "examples": v["summaries"][:2],
            })
    return {"state": state, "nodes": nodes, "edges": edges, "findings": findings,
            "revenue_at_risk_per_day_usd": sum({f["feature"].split(" (")[0]: f["revenue_at_risk_per_day_usd"] or 0 for f in findings}.values())}  # count each feature once


@app.get("/api/graph")
def graph(state: str = "before"):
    return snapshot(state)


@app.get("/api/runs")
def runs():
    out = []
    for p in sorted((ROOT / "data/runs").glob("*.json")):
        d = json.loads(p.read_text())
        out.append({k: d.get(k) for k in ("label", "mode", "steps", "tool_calls", "tokens_in", "cost_usd_est", "seconds", "tests_pass", "vulns_remaining")} | {"file": p.name})
    return out


@app.post("/api/onboard/scan")
async def onboard_scan(req: Request):
    ip = req.client.host if req.client else "?"
    if onboard.rate_limited(ip):
        return {"error": "Rate limit: 6 scans per hour. Please try again later."}
    body = await req.json()
    return onboard.scan_repo(str(body.get("repo_url", "")))


@app.get("/onboard")
def onboard_page():
    return FileResponse(ROOT / "web/static/onboard.html")


app.mount("/static", StaticFiles(directory=ROOT / "web/static"), name="static")


@app.get("/")
def index():
    return FileResponse(ROOT / "web/static/index.html")
