# hackathon.md — Blast Radius (Team Redemption)

## Overview
Change-impact agent: traces any change (CVE, breaking release, licence, vendor health) through a live dependency graph, reports business impact, and auto-fixes what it can. See PLAN.md.

## Team
Akshat Kumar (lead)

## Stack (actual)
neatlogs · Entire · cfo.ai · LiteLLM (Claude/Nova) · Crustdata · Python/FastAPI

## Build log
<!-- dated entries: change, experiment, failure, fix, evidence link. Real results only. -->
- 2026-10-10: repo initialised, plan drafted.
- 2026-10-10: neatlogs smoke trace via LiteLLM works (doctor PASS, trace visible in dashboard).
- 2026-10-10: seeded demo shop (Jinja2 2.11.2 / requests 2.25.1 / urllib3 1.26.18; Jinja2 3.x removes `Markup` -> breaking). Baseline 4/4 tests green; plain bump -> ImportError.
- 2026-10-10: **Baseline run (naive agent v1, claude-sonnet-4.6)**: 3 vulnerable pins found via OSV, all fixed, tests green. 19 LLM steps, 36 tool calls, 48.3k in / 3.3k out tokens, ~$0.19 (price estimate, not billing), 46.5s. Waste observed: each package re-lists and re-reads the same files (7 read_file calls per package), packages fixed in 3 separate loops with fresh context. Evidence: data/runs/baseline-*.json + neatlogs session `baseline-*`.

## Demo
TBD

## Known limitations / next steps
- Business impact mapping is customer-supplied (business.yaml).

## Submission checklist
See PLAN.md.

### Before/after (n=3 each, same task, claude-sonnet-4.6, cost = price estimate not billing)
| Metric | Baseline (naive v1) | Improved (v2) | Change |
|---|---|---|---|
| LLM steps | 19.7 | 4.3 | -78% |
| Tool calls | 36.3 | 5.3 | -85% |
| Input tokens | 50.2k | 8.8k | -82% |
| Est. cost / run | $0.199 | $0.041 | -79% |
| Time | 48.4s | 18.5s | -62% |
| Tests pass | 3/3 | 3/3 | - |
| Vulns left (OSV rescan) | 0 | 0 | - |

What changed (driven by the baseline trace): import graph -> only affected files given up front; all packages fixed in one loop with shared context; read cache; independent OSV re-scan after the run. Evidence: data/runs/baseline-*.json, data/runs/improved-*.json, neatlogs sessions tagged `baseline` / `improved`.

### Trace evidence (neatlogs, project "Akshat's project", login required)
- Baseline: session `baseline-1791636569`, trace `255ee8a85c19593e0312fbd6891f76fb` (56 steps, 46s). Screenshot: social/media/4-trace-baseline.jpg
- Improved: session `improved-1791636695`, trace `d188c16c6b87dfdbe18a626b3a79b4bf` (16 steps, 15s). Screenshot: social/media/5a-trace-improved.jpg
- Deep link: https://app.neatlogs.com/traces/<trace_id>?orgId=dac38424-2836-4527-95a0-ceea14b47efd&projectId=a2e32ac6-ebdc-429e-adbf-8235258a1776

### Deployment (AWS, us-east-1)
- Read-only dashboard served from EC2 `i-0ca61987b0c92f116` (t2.micro, Amazon Linux 2023, Hackathon_VPC public subnet, HTTP/80 only, no SSH key). Live at http://54.147.135.237/ (public IP is not an Elastic IP; it changes if the instance is stopped and started).
- Booted from `deploy/user-data.sh`: clones this repo, installs `web/requirements.txt`, runs uvicorn under systemd. No secrets on the box; the agent runner (which uses the LiteLLM key) is NOT deployed.
- The dashboard queries the public OSV.dev API (10-minute cache). Revenue-at-risk figures are demo inputs from `demo/shop/business.yaml`.

### Entire proof
- Repo mirrored on Entire (GitHub App installed on this repo only). Public, no login needed.
- Checkpoint link: https://entire.io/gh/Axhat/neatlogs-hack/commit/a50363dd0691b008d1ecc9966c9152cd93948c3b
- Checkpoint ID: `01M4JYYTA9J94PDTA97JDYS36X` (session: "push it and get the trace links", Claude Code)
- Entire features used: Checkpoints (all commits). Graph/Brain not yet used; our dependency graph is a custom import scanner.

### Entire Graph in the agent loop
- Installed `entire plugin install graph` (v0.4.0). The agent's `--mode entire` asks `entire graph search` which files use each vulnerable package, then confirms each hit by checking the import line (hybrid: Entire finds, we verify). Falls back to our own AST scan if the CLI is missing.
- 3 runs, claude-sonnet-4.6: tests pass 3/3, 0 vulns left (OSV re-scan), avg ~4.7 steps, ~$0.044 est. per run, ~18.6s. Same task and similar cost to our own scanner (v2), so Entire's graph replaces our custom code without a loss.
- Note: Entire Graph returned nothing for a plain (non-git) folder; the demo work copy is now a throwaway git repo (see `demo/shop/scripts/reset.sh`).

### Replay on real open-source repos
See OSS_REPLAY.md. 4 real repos (of 51 tried; only 6 reproducible at all), agent matched or beat the maintainers' Dependabot fix, tests passed after, remaining vulns are Python-3.9-environment limits. Honest limits are listed in that file.
