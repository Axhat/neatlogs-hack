# Blast Radius

**Team Redemption · neatHack 2026**

> Every company runs on software it didn't write. Blast Radius tells you what a change in that software puts at risk, in business terms, and fixes the part it can.

## The problem
When a dependency turns out to be vulnerable, the people who must decide what to do (product, finance, support, security) don't see packages. They need to know *what breaks, who owns it, how much it costs, and by when.* Engineers meanwhile lose time on upgrades that look easy and aren't: a plain version bump can break the build.

## What it does
1. **Finds** vulnerable pinned packages using the public OSV.dev advisory database.
2. **Maps** them: code → packages → features → revenue and owner. The code side is built by scanning imports; the business side comes from a small file the customer fills in (`business.yaml`). It is an input, not something we infer.
3. **Shows** a non-engineer dashboard: revenue at risk per day, owner, plain-language advisories, before/after the fix.
4. **Fixes** it with an agent that upgrades the packages, patches the code that breaks, runs the tests, and retries. In the demo shop, Jinja2 3.x removes `Markup`, so the agent has to change code, not just a version number.
5. **Re-checks** the final pins against OSV independently of the agent.

## Results (3 runs each, same task, tests pass 3/3 on both)
| | Naive agent | Improved agent | Change |
|---|---|---|---|
| LLM steps | 19.7 | 4.3 | -78% |
| Tool calls | 36.3 | 5.3 | -85% |
| Input tokens | 50.2k | 8.8k | -82% |
| Est. cost / run | $0.199 | $0.041 | -79% |
| Time | 48.4s | 18.5s | -62% |

The improvement came straight from the neatlogs trace of the first run, which showed the agent re-listing and re-reading the same files for every package. The fix: give the agent only the files that import the package, fix all packages in one pass, cache repeat reads. Cost is our estimate from token counts and assumed model prices, not billing data.

## How the required tools are used
- **neatlogs:** every run is traced (workflow → agent → LLM/tool spans). The before/after comparison above is read off those traces.
- **Entire:** checkpoints tie each change to the session that produced it (11 so far). We have not yet used Entire's Graph; our dependency graph is our own import scanner.
- **cfo.ai:** Ari models pricing, unit economics and runway. We fed it the measured cost per run and a stress multiplier for real repos. Draft assumption: per-repo subscription with a capped number of included fixes and overage pricing.

## Honest limitations
- The demo is a small seeded Python shop; real repos are larger, hence the stress multiplier in the cost model.
- Revenue-at-risk figures are demo inputs.
- Only the CVE/upgrade path is automated. Vendor-health (Crustdata) and licence checks are planned, not built.
- Three runs per version is a small sample.
- The deployed dashboard is read-only; the agent runner is deliberately not exposed publicly because it uses a shared, budgeted model key.

## Links
- Repo: https://github.com/Axhat/neatlogs-hack
- Progress thread: https://x.com/axhat_/status/2108951386805387510
- Dashboard (AWS us-east-1, may be taken down after judging): http://54.147.135.237/
