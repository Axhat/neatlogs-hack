# X thread #1 (progress post) — attach video/out/intro.mp4 to post 1
Replace [TRACE-LINK] with real neatlogs trace links after checking the dashboard. Tag the official accounts yourself.

1/6
Every company runs on software it didn't write.

When a dependency turns out to be vulnerable, who finds out what breaks, who owns it, and what it costs?

We're building Blast Radius for #neatHack 🧵
[attach intro.mp4]

2/6
Blast Radius builds a live map: code → packages → features → revenue.

A vulnerable package isn't "CVE-2020-xxxx". It's "receipts, $1.5k/day, owner: Support".
(Demo data; revenue figures come from a file the customer fills in.)

3/6
Then an agent fixes it. It reads OSV advisories for the pinned packages, patches the code, installs, runs tests, retries.

On our demo shop: 3 vulnerable pins. One upgrade (Jinja2 3.x) breaks the build because `Markup` moved to markupsafe. The agent has to fix the code, not just bump a version.

4/6
Run 1 was naive. We traced it with @neatlogs and saw it re-list and re-read the same files for every package: 19.7 LLM steps, 36 tool calls, ~$0.20 per run.
[TRACE-LINK]

5/6
Fix, from the trace: use the import graph so the agent only gets affected files, one pass for all packages, cache repeated reads, re-scan OSV at the end.

Same task, 3 runs each, tests pass 3/3 on both:
steps 19.7 → 4.3 (-78%)
tool calls 36.3 → 5.3 (-85%)
est. cost $0.199 → $0.041 (-79%)
time 48s → 18.5s
(cost = our price estimate, not billing)

6/6
Built with neatlogs (tracing), Entire (code context + checkpoints), cfo.ai (pricing + runway).
Next: vendor-health signals (Crustdata), licence risk, and a dashboard a non-engineer can read.

Repo: https://github.com/Axhat/neatlogs-hack
