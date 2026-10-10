# Blast Radius — change-impact agent for a company's software estate

> Every company runs on software it didn't write and vendors it doesn't control.
> Blast Radius tells you what any change puts at risk, in business terms, and fixes the part it can.

Team: Redemption · neatHack Oct 10–12 2026 · submit Oct 12, 7:00–11:55 PM IST

## Core loop
event -> trace through dependency graph -> business impact ($, deadline, owner) -> fix or recommend -> audit trail

Graph: code -> packages/APIs -> vendors -> features -> revenue/cost.
Code side comes from Entire graph; business side from a customer-editable `business.yaml`
(honestly disclosed as input, not magic).

## Triggers
| Trigger | Source | Output |
|---|---|---|
| CVE | OSV.dev | **Full auto-fix path**: upgrade -> patch -> tests -> PR |
| Breaking release / deprecation | registry + changelog | **Full auto-fix path** (same engine) |
| Licence conflict | deps.dev / registry metadata | report + alternative (no auto-fix) |
| Vendor health | Crustdata company data | risk score + fallback (no auto-fix) |
| Cost / unused dep | sample billing CSV | report |

## Architecture
- `agent/` Python. OpenAI SDK -> LiteLLM (`claude-sonnet-4.6` patching, `nova-lite` triage). neatlogs-instrumented.
- `graph/` builds graph JSON (Entire graph + manifests + business.yaml).
- `triggers/` osv.py, release.py, license.py, vendor.py (Crustdata)
- `web/` FastAPI + static dashboard (Cytoscape.js). Non-dev view: risk $, deadline, plain-language summary. Nodes red -> green after fix.
- `demo/shop/` seeded sample app: vulnerable dep + breaking upgrade + real tests.
- `evals/` fixed task set; script prints fix-rate / cost / latency from neatlogs runs.

## How each required tool earns its weight
- **neatlogs**: customer-facing audit trail AND our evidence. Run 1 = naive agent baseline (repeated file reads, blind retries); Run 2 = improved. Report numbers.
- **Entire**: graph feeds the product; a checkpoint per agent change; submit checkpoint link + ID.
- **cfo.ai**: cost per event from neatlogs -> pricing, margin, runway. Plan goes in submission.

## Budget guardrails
LiteLLM key: $20 / 30 days shared. Fast model for triage, Sonnet only for patch/verify. Cache by (file hash, prompt). Cap steps + tokens per run. Never run evals in a loop unattended.

## Timeline (IST)
- Sat eve: env, keys, entire enabled, neatlogs hello-trace, demo/shop seeded + failing tests. Commit + first checkpoint.
- Sun AM: graph builder + CVE trigger + naive agent end-to-end. **Baseline neatlogs trace.**
- Sun PM: dashboard; fix agent waste; **improved trace**; vendor-health (Crustdata) + licence reports.
- Sun night: cfo.ai plan; failure-recovery run captured; start demo script.
- Mon AM: polish, record demo, hackathon.md complete, X thread drafted.
- Mon 7:00–11:55 PM: submit on X (aim for early in the window — first 50 get engagement).

## Building in public (15%)
Post: idea -> first trace -> a failure + fix -> before/after numbers -> demo. #neatHack. Sanitized evidence only (no keys/env/customer data).

## Submission checklist
- [ ] public repo, hackathon-dated commits
- [ ] demo video showing neatlogs + Entire + cfo.ai
- [ ] two neatlogs traces (before/after) + numbers
- [ ] failure-recovery run
- [ ] Entire checkpoint link + ID (+ graph output)
- [ ] cfo.ai business plan
- [ ] X post quoting official neatlogs post, #neatHack
