"""Replay a real Dependabot fix: check out the commit BEFORE a maintainer merged a dependency bump,
let the agent fix it, then compare with what the human did.

Usage: python -m oss.replay candidates.json <repo> [--mode entire|improved|naive]
Candidate fields: repo, pr, title, parent, merge, files, date.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

import neatlogs  # noqa: E402

from agent import graph as depgraph, osv  # noqa: E402
from agent.fixer import fix_all, make_client  # noqa: E402
from agent.tools import Sandbox  # noqa: E402


def sh(cmd, cwd, t=600):
    r = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=t)
    return r.returncode, (r.stdout + r.stderr)


def prepare(c, base):
    """Clone, check out the pre-fix commit, rebuild the env as of that date (uv --exclude-newer)."""
    d = base / c["repo"].replace("/", "__")
    sh(f"rm -rf '{d}'", base)
    assert sh(f"git clone -q --filter=blob:none https://github.com/{c['repo']}.git '{d}'", base)[0] == 0
    assert sh(f"git checkout -q -f {c['parent']}", d)[0] == 0
    req = [f for f in c["files"] if f.endswith(".txt")][0]
    rc, out = sh(f"uv venv -q --python 3.9 .venv && uv pip install -q --python .venv/bin/python pytest && "
                 f"uv pip install -q --python .venv/bin/python -r {req} --exclude-newer {c['date']}T23:59:59Z", d)
    return d, req, rc, out


def main():
    cands = json.load(open(sys.argv[1]))
    c = next(x for x in cands if x["repo"] == sys.argv[2])
    mode = sys.argv[sys.argv.index("--mode") + 1] if "--mode" in sys.argv else "entire"
    base = ROOT / "data" / "oss"
    base.mkdir(parents=True, exist_ok=True)
    d, req, rc, out = prepare(c, base)
    if rc:
        print(json.dumps({"repo": c["repo"], "stage": "env-build-failed", "detail": out[-300:]}))
        return
    neatlogs.init(workflow_name="blast-radius-oss", tags=["oss", mode])
    sb = Sandbox(d)
    sb.req = req
    before_tests = sb.run_tests()
    reqs = (d / req).read_text()
    findings = [f for f in osv.scan(reqs) if f["target"]]
    client = make_client()
    t0 = time.time()
    stats = None
    if findings and before_tests.startswith("exit=0"):
        pins = osv.parse_pins(reqs)
        g = depgraph.build_with_entire(d, pins) if mode == "entire" else depgraph.build(d, pins)
        with neatlogs.identify(session_id=f"oss-{c['repo'].replace('/', '_')}-{int(t0)}"):
            stats = fix_all(client, sb, findings, g, max_steps=20)
    after_tests = sb.run_tests()
    diff = sh("git diff --stat", d)[1].strip()
    remaining = osv.scan((d / req).read_text())
    res = {"repo": c["repo"], "pr": c["pr"], "human_fix": c["title"], "human_files": c["files"], "mode": mode,
           "tests_before": before_tests.startswith("exit=0"), "vulns_before": len(findings),
           "tests_after": after_tests.startswith("exit=0"), "vulns_after": len(remaining),
           "agent_changed": diff.splitlines()[:8], "seconds": round(time.time() - t0, 1), "stats": stats}
    neatlogs.flush()
    out_f = ROOT / "data" / "runs" / f"oss-{c['repo'].replace('/', '__')}-{mode}-{int(t0)}.json"
    out_f.write_text(json.dumps(res, indent=2))
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
