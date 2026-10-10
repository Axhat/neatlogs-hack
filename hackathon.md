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
