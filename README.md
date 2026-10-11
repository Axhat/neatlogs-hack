# Blast Radius

**What does a vulnerable dependency put at risk, in business terms, and can an agent fix it safely?**
Team Redemption (solo) · neatHack 2026 · built with **neatlogs**, **Entire** and **cfo.ai**

When a package is vulnerable, the people who decide what to do (product, finance, support, security) don't see packages. They need *what breaks, who owns it, what it costs, by when*. Blast Radius maps code → packages → features → revenue and owner, then an agent upgrades the packages, patches code that breaks, runs the tests, and re-checks with an independent scan.

- **Demo video:** posted on X with the submission (source: [video/](video/))
- **Progress thread:** https://x.com/axhat_/status/2108951386805387510
- **Live dashboard (AWS us-east-1):** http://100.31.116.240/ (read-only) · onboarding: http://100.31.116.240/onboard · the box re-pulls this repo every 5 minutes (`deploy/user-data.sh`)
- **Write-up:** [WRITEUP.md](WRITEUP.md) · **Build log:** [hackathon.md](hackathon.md)

## Results (honest numbers)
Same task, 3 runs each, tests pass 3/3 on both (cost is our estimate from token counts, not billing):

| | Naive agent | Improved agent | Change |
|---|---|---|---|
| LLM steps | 19.7 | 4.3 | -78% |
| Tool calls | 36.3 | 5.3 | -85% |
| Est. cost / run | $0.199 | $0.041 | -79% |
| Time | 48.4s | 18.5s | -62% |

On **4 real open-source repos** (rewound to just before maintainers merged a Dependabot fix) the agent matched or beat the human fix and tests still passed. Only 6 of 51 old repos could even be rebuilt, which is a finding in itself. Details and limits: [OSS_REPLAY.md](OSS_REPLAY.md).

## How the three required tools are used
| Tool | In the product | In building it | Evidence |
|---|---|---|---|
| **neatlogs** | Audit trail of every fix (what the agent read, changed, spent) | The first trace exposed wasted re-reads; fixing it gave the table above. Also holds a real failed-action → recovery trace | `hackathon.md` (trace IDs), `social/media/*trace*.jpg` |
| **Entire** | **Graph** finds the files and covering test for a package (agent `--mode entire`). **Checkpoints** tie each commit to the session that made it | Every commit has a checkpoint | [Checkpoint](https://entire.io/gh/Axhat/neatlogs-hack/commit/a50363dd0691b008d1ecc9966c9152cd93948c3b) · ID `01M4JYYTA9J94PDTA97JDYS36X` |
| **cfo.ai** | Pricing and runway from the measured cost per fix | Showed why the cost cut matters at real-repo scale | [docs/cfo-plan.md](docs/cfo-plan.md), `social/media/cfo-*.jpg` |

## Run it
```bash
cp .env.example .env            # LITELLM_API_KEY, NEATLOGS_API_KEY (agent only); the dashboard needs no keys
uv venv && uv pip install -r requirements.txt

.venv/bin/uvicorn web.app:app --port 8765     # dashboard at /, onboarding at /onboard
demo/shop/scripts/reset.sh                    # fresh seeded demo shop (vulnerable pins)
.venv/bin/python -m agent.run --label try --mode entire        # fix it (naive | improved | entire)
.venv/bin/python -m oss.replay data/oss_candidates.json Snehasis5/ci-cd-demo   # replay a real repo
```
The agent runner uses a shared, budgeted model key, so it is **not** deployed publicly; the deployed dashboard is read-only.

## Layout
`agent/` scan (OSV), graph, fixer loop, tools · `web/` dashboard + onboarding · `oss/` real-repo replay · `demo/shop/` seeded app · `video/` Remotion demo · `data/runs/` raw run results · `docs/` plans

## Limitations
Demo business data is hand-written (`business.yaml`); real onboarding asks the buyer to confirm it. Python `requirements.txt` only. Small samples (n=3 per agent, 4 real repos, some with a single test). Costs are estimates. Onboarding is a prototype with no sign-up or billing.
