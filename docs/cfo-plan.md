# Business plan (built with cfo.ai / Ari)

Source: cfo.ai workspace "Akshat CFOAI", scenario "Main Scenario" (pages: Overview, Revenue & AI costs, Drivers, People & Cash). All inputs are **draft assumptions** for a pre-revenue project, in USD, not predictions.

## Unit of work
One agent run = one repo-wide remediation event (it fixes every vulnerable pinned package in a repo). Package count does not multiply cost.

## Measured inputs (our traced runs, 3 each, same small demo task, tests pass 3/3)
| | Naive v1 | Improved v2 |
|---|---|---|
| LLM steps | 19.7 | 4.3 |
| Tool calls | 36.3 | 5.3 |
| Input / output tokens | ~50.2k / ~3.3k | ~8.8k / ~1.0k |
| Time | 48.4s | 18.5s |
| Token cost per run at $3/$15 per 1M | $0.2001 | $0.0414 |

Prices are assumed list rates, not billing data.

## Cost per event under stress (real repos are bigger than the demo)
Token cost = demo cost x token stress x 1.5 attempts.
| | Naive v1 | Improved v2 |
|---|---|---|
| 5x stress | $1.50 | $0.31 |
| 10x stress (base) | $3.00 | $0.62 |
| 20x stress | $6.00 | $1.24 |

## Pricing proposal (not a customer commitment)
| Segment | Per repo / month | Included events | Per extra event |
|---|---|---|---|
| Startup teams | $15 | 1 | $7 |
| Growth teams | $25 | 2 | $7 |

Assumed usage 2 / 4 events per repo-month (not measured). No carryover or pooling.

## Results from the model (Ari's figures)
- At v2, 20x stress, 1.5x attempts, the $7 overage has about 82% token margin; with v1 under the same conditions only about 14%.
- Gross margin, Sep 2028: v2 at 10x stress 90.4%, v1 at 10x 66.6%, v2 at 20x 84.2%.
- Runway with an illustrative $25,000 opening cash and $5,000 buffer: v2 (base and 20x) stays above the buffer through Sep 2028; v1 at 20x breaches it in Dec 2027 and goes negative in Feb 2028; slow-acquisition downside (v2, 20x, 3x attempts) goes negative in Nov 2027.
- Caveat from Ari: the higher cash forecast comes mainly from newly assumed overage billing, not only cheaper compute. Customer acceptance and collection are unvalidated. Monitoring, CI and support costs are not measured.

## What this shows
The cost reduction we found in neatlogs traces (about 79% per run) is what keeps a flat per-repo subscription profitable when repos are 10-20x larger than the demo.
