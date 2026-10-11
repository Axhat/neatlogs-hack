"""CLI: scan the demo shop for vulnerable pins and fix them. Writes a run summary to data/runs/."""
import argparse
import json
import subprocess
import time
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

import neatlogs  # noqa: E402

from . import osv  # noqa: E402
from . import graph as depgraph  # noqa: E402
from .fixer import fix_all, fix_package, make_client  # noqa: E402
from .tools import Sandbox  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--label", default="baseline")
    ap.add_argument("--max-steps", type=int, default=25)
    ap.add_argument("--mode", choices=["naive", "improved", "entire"], default="naive")
    args = ap.parse_args()

    neatlogs.init(workflow_name="blast-radius", tags=[args.label])
    subprocess.run([str(ROOT / "demo/shop/scripts/reset.sh")], check=True, capture_output=True)
    sb = Sandbox(ROOT / "data/workdir/shop")
    client = make_client()
    t0 = time.time()

    @neatlogs.span(kind="WORKFLOW", name=f"blast-radius-run:{args.label}")
    def run():
        findings = osv.scan((sb.root / "requirements.txt").read_text(), sb.python_version())
        todo = [f for f in findings if f["target"]]
        if args.mode in ("improved", "entire"):
            pins = osv.parse_pins((sb.root / "requirements.txt").read_text())
            g = depgraph.build_with_entire(sb.root, pins) if args.mode == "entire" else depgraph.build(sb.root, pins)
            results = [{"finding": {"packages": [f["package"] for f in todo]}, **fix_all(client, sb, todo, g, max_steps=args.max_steps)}]
        else:
            results = [{"finding": f, **fix_package(client, sb, f, max_steps=args.max_steps)} for f in todo]
        return findings, results

    with neatlogs.identify(session_id=f"{args.label}-{int(t0)}"):
        findings, results = run()
    tests = sb.run_tests()
    remaining = osv.scan((sb.root / "requirements.txt").read_text(), sb.python_version())  # independent re-scan of the final pins
    summary = {
        "label": args.label, "seconds": round(time.time() - t0, 1),
        "mode": args.mode, "tests_pass": tests.startswith("exit=0"), "findings": len(findings),
        "vulns_remaining": len(remaining),
        "steps": sum(r["steps"] for r in results), "tool_calls": sum(r["tool_calls"] for r in results),
        "tokens_in": sum(r["tokens_in"] for r in results), "tokens_out": sum(r["tokens_out"] for r in results),
        "cost_usd_est": round(sum(r["cost_usd_est"] for r in results), 4), "results": results,
    }
    out = ROOT / "data/runs" / f"{args.label}-{int(t0)}.json"
    out.write_text(json.dumps(summary, indent=2))
    neatlogs.flush()
    print(json.dumps({k: v for k, v in summary.items() if k != "results"}, indent=2), f"\n-> {out}")


if __name__ == "__main__":
    main()
