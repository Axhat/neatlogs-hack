# Replay on real open-source repos

**Question:** does the agent fix real vulnerabilities in real code, not just our seeded demo?

**Method.** We searched GitHub for merged Dependabot pull requests that bumped a vulnerable Python dependency (88 screened, 55 touching only a requirements file). For each, we checked out the commit *just before* the maintainer's fix, rebuilt the environment with only package versions that existed on that commit's date (Python 3.9, `uv --exclude-newer`), and ran the repo's own tests. Then the agent (Entire Graph file lookup mode) tried to fix it, and we compared with what the human did.

## Reproducibility is the real obstacle
Of 51 repos we could try, only **6 passed their own tests before the fix** (4 also passed after the human fix). 26 failed to install at all (pinned conflicts, wheels that no longer build) and the rest failed their tests. We ran the agent on those 4.

## Results (agent run, claude-sonnet-4.6, 1 run each)
| Repo | Human fix (real PR) | Agent fix | Tests before / after | Vulns before / after | Steps | Est. cost |
|---|---|---|---|---|---|---|
| Snehasis5/ci-cd-demo | Bump requests from 2.19.0 to 2.32.3 | requests 2.19.0 -> 2.32.3 (same as human) | pass / pass | 1 / 1 | 6 | $0.031 |
| apqlzm/scraposer | Bump lxml from 4.6.5 to 4.9.1 | requests 2.20.0 -> 2.32.3, lxml 4.6.5 -> 6.1.0 (human only did lxml 4.9.1) | pass / pass | 2 / 1 | 7 | $0.119 |
| funkaoshi/osr-opml | Bump lxml from 4.9.3 to 6.1.0 | lxml 4.9.3 -> 6.1.0 (same as human) | pass / pass | 2 / 1 | 8 | $0.105 |
| kapihllkumar/my-blog-practice | Bump requests from 2.19.1 to 2.32.2 | requests 2.19.1 -> 2.32.3 (human: 2.32.2) | pass / pass | 1 / 1 | 6 | $0.030 |

(Cost is our token-price estimate, not billing data.)

## What this shows
- In all 4 real repos the agent upgraded to the same version the maintainer chose or a newer one, tests passed, and no source changes were needed.
- In all 4 a vulnerability remained, and it was a Python-version limit, not an agent error: the newest fixed release (e.g. requests 2.33.0, soupsieve 2.9.0) needs Python 3.10+, but we had to rebuild these old projects on 3.9. The agent noticed, picked the newest release that installs on 3.9, and said so in its summary.

## Limits (please read)
- **Tiny samples:** 4 repos, 1 run each; some have a single test, so "tests pass" is a weak check.
- **No breaking change in these 4.** The bumps happened to need no code edits, so they don't exercise the code-fixing part. Our seeded demo does (Jinja2 3.x removes `Markup`).
- **Environment is not the maintainers' real one** (Python 3.9, dependencies as of the commit date).
- The OSV "target" version is the highest fixed release and can be unreachable on the project's Python; making target selection Python-aware is a clear next step.

Raw results: `data/runs/oss-*.json`. Candidate list: `data/oss_candidates.json`. Harness: `oss/replay.py`.
