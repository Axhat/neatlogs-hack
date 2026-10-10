# X thread #1 — progress post (6 parts)

Handles verified on x.com: @neatlogs, @EntireHQ (NOT @entireio — that's a placeholder account), @arithecfo (cfo.ai).
Official post to QUOTE for the final submission (not for these progress posts): @neatlogs, 8 Oct, "okay guys, the wait is finally over. there's only one track for #neatHack..." 
neatlogs trace URLs need a login, so traces go up as screenshots. Don't tag judges unless you want to.

## 1/6   media: social/media/1-video.mp4
Every company runs on software it didn't write.

When a dependency turns out to be vulnerable, who works out what breaks, who owns it, and what it costs?

Building Blast Radius for #neatHack 🧵

## 2/6   media: social/media/2a-dashboard-before.jpg, 2b-dashboard-after.jpg
Blast Radius maps code → packages → features → revenue.

So a vulnerable package isn't "10 advisories". It's "receipts, $1.5k/day, owner: Support".

(Demo data. Revenue figures come from a file the customer fills in.)

## 3/6   media: none
Then an agent fixes it: reads OSV advisories for the pinned packages, patches the code, installs, runs tests, retries.

On our demo shop, Jinja2 3.x removes `Markup`. A plain version bump breaks the build, so the agent has to fix the code too.

## 4/6   media: social/media/4-trace-baseline.jpg
Run 1 was naive. Tracing it with @neatlogs showed it re-listing and re-reading the same files for every package.

19.7 LLM steps and 36 tool calls per run, about $0.20 (our estimate from token counts).

## 5/6   media: social/media/5a-trace-improved.jpg, 5b-results-bars.png
Fix, straight from the trace: give the agent only the files that import the package, fix all packages in one pass, cache repeat reads, re-scan OSV at the end.

3 runs each, tests pass 3/3 on both:
steps 19.7 → 4.3
cost ~$0.199 → $0.041
time 48s → 18.5s

## 6/6   media: none (repo link card)
Stack: @neatlogs for tracing, @EntireHQ for code context + checkpoints, @arithecfo for pricing and runway (in progress).

Next: vendor-health signals via Crustdata, licence risk.

Repo: https://github.com/Axhat/neatlogs-hack
#neatHack
