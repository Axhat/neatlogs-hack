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
