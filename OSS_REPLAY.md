# Replay on real open-source repos

**Question:** does the agent fix real vulnerabilities in real code, not just our seeded demo?

**Method.** We searched GitHub for merged Dependabot pull requests that bumped a vulnerable Python dependency (88 screened, 55 touching only a requirements file). For each, we checked out the commit *just before* the maintainer's fix, rebuilt the environment with only package versions that existed on that commit's date (Python 3.9, `uv --exclude-newer`), and ran the repo's own tests. Then the agent (Entire Graph file lookup mode) tried to fix it, and we compared with what the human did.

## Reproducibility is the real obstacle
Of 51 repos we could try, only **6 passed their own tests before the fix** (4 also passed after the human fix). 26 failed to install at all (pinned conflicts, wheels that no longer build) and the rest failed their tests. We ran the agent on those 4.

## Results (claude-sonnet-4.6, 1 run each, Python-aware targeting)
| Repo | Human fix (real PR) | Agent fix | Tests before / after | Advisories blocked by project's Python | Steps | Est. cost |
|---|---|---|---|---|---|---|
| Snehasis5/ci-cd-demo | Bump requests from 2.19.0 to 2.32.3 | requests 2.19.0 → 2.32.5 (human: 2.32.3) | pass / pass | requests (needs 2.33.0) | 5 | $0.022 |
| apqlzm/scraposer | Bump lxml from 4.6.5 to 4.9.1 | requests → newest installable on 3.9, lxml → 6.1.0 (human only did lxml 4.9.1) | pass / pass | requests (needs 2.33.0) | 5 | $0.082 |
| funkaoshi/osr-opml | Bump lxml from 4.9.3 to 6.1.0 | lxml 4.9.3 → 6.1.0 (same as human) | pass / pass | soupsieve (needs 2.9.0) | 5 | $0.058 |
| kapihllkumar/my-blog-practice | Bump requests from 2.19.1 to 2.32.2 | requests 2.19.1 → newest installable on 3.9 (human: 2.32.2) | pass / pass | requests (needs 2.33.0) | 5 | $0.022 |

(Cost is our token-price estimate, not billing data.)

**Python-aware targeting.** Our first replays picked the newest fixed release even when the project's Python could not install it, so one advisory always remained. The agent now picks the *smallest upgrade with no known advisories that the project's Python can install*, and reports what is blocked until Python is upgraded (for example, `requests 2.33.0` and `soupsieve 2.9.0` need Python 3.10+). That list is an actionable item for the buyer ("upgrade Python to clear these").

## A real failure and how the agent recovered
Run on `Snehasis5/ci-cd-demo` with the older, Python-blind targeting (`--ignore-python`) so the failure reproduces. Raw result: `data/runs/oss-Snehasis5__ci-cd-demo-entire-ignorepy-*.json`; the same run is in neatlogs (session `oss-Snehasis5_ci-cd-demo-*`).

1. `write_file` ✅: wrote requirements.txt (17 chars)
2. `install_requirements` ❌ FAILED: exit=1   × No solution found when resolving dependencies:   ╰─▶ Because the current Python version (3.9.25) does not satisfy       Python>=3.10 and requests==2.33.0 depen
3. `write_file` ✅: wrote requirements.txt (17 chars)
4. `install_requirements` ✅: exit=0 
5. `run_tests` ✅: exit=0 .                                                                        [100%] 1 passed in 0.00s 
6. `finish` ✅: ok

The install failed because `requests 2.33.0` needs Python 3.10+. The agent read the error, switched to a compatible version, reinstalled, and the tests passed. Final summary (agent): "Updated requests from 2.19.0 to 2.32.3 in requirements.txt. The originally requested 2.33.0 requires Python ≥ 3.10, but the runtime is Python 3.9, so 2.32.3 — the highest version compatible with Python 3.9 that resolves all 10 listed security advisories — was "

## Limits (please read)
- **Tiny samples:** 4 repos, 1 run each; some have a single test, so "tests pass" is a weak check.
- **No breaking change in these 4.** The bumps happened to need no code edits, so they don't exercise the code-fixing part. Our seeded demo does (Jinja2 3.x removes `Markup`).
- **Environment is not the maintainers' real one** (Python 3.9, dependencies as of the commit date).

Raw results: `data/runs/oss-*.json`. Candidate list: `data/oss_candidates.json`. Harness: `oss/replay.py`.
