import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";

const BG = "#0b0f1a", INK = "#e8ecf4", DIM = "#8a94a8", RED = "#ff4d5e", GREEN = "#2fd27a", BLUE = "#5b8cff", CARD = "#131a2b", LINE = "#232c45";
const font = "Inter, -apple-system, Helvetica, Arial, sans-serif";
const mono = "SF Mono, Menlo, Consolas, monospace";
const ease = Easing.out(Easing.cubic);
const f = (n: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(n, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const S = 30;
const dur = (sec: number) => Math.round(sec * S);

const TOOLS = ["neatlogs", "Entire", "cfo.ai"];

// Scene frame: title, three-tool bar (active tool lit), content, caption.
const Scene = ({ dur: d, tool, title, caption, children }: any) => {
  const n = useCurrentFrame();
  const op = Math.min(f(n, 0, 12), 1 - f(n, d - 12, d));
  return (
    <AbsoluteFill style={{ background: BG, opacity: op, fontFamily: font }}>
      <div style={{ position: "absolute", top: 20, left: 40, right: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: INK, fontSize: 30, fontWeight: 700 }}>{title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {TOOLS.map((t) => {
            const on = tool === t;
            return (
              <div key={t} style={{ fontSize: 18, fontWeight: 600, padding: "4px 14px", borderRadius: 99, border: `1px solid ${on ? BLUE : LINE}`, background: on ? BLUE : "transparent", color: on ? "#fff" : DIM }}>{t}</div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", top: 74, left: 40, right: 40, bottom: 112, display: "flex", justifyContent: "center", alignItems: "center" }}>{children}</div>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 22, color: INK, fontSize: 25, lineHeight: 1.35, textAlign: "center" }}>{caption}</div>
    </AbsoluteFill>
  );
};

const Shot = ({ src, d, zoom = 0.05 }: any) => {
  const n = useCurrentFrame();
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 12, border: `1px solid ${LINE}`, background: "#000" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "contain", transform: `scale(${1 + zoom * (n / d)})` }} />
    </div>
  );
};

const Slides = ({ srcs, d }: any) => {
  const n = useCurrentFrame();
  const per = d / srcs.length;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {srcs.map((src: string, i: number) => {
        const a = i * per, b = (i + 1) * per;
        const o = Math.min(f(n, a, a + 10), 1 - (i < srcs.length - 1 ? f(n, b - 10, b) : 0));
        return <div key={src} style={{ position: "absolute", inset: 0, opacity: o }}><Shot src={src} d={per} zoom={0.03} /></div>;
      })}
    </div>
  );
};

// Cross-fade between arbitrary children by time ranges (in seconds within the scene).
const Switch = ({ parts }: any) => {
  const n = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {parts.map((p: any, i: number) => {
        const a = dur(p.from), b = dur(p.to);
        const o = Math.min(f(n, a, a + 10), 1 - (i < parts.length - 1 ? f(n, b - 10, b) : 0));
        return <div key={i} style={{ position: "absolute", inset: 0, opacity: o, display: "flex", alignItems: "center" }}><Sub from={a}>{p.node}</Sub></div>;
      })}
    </div>
  );
};
const Sub = ({ from, children }: any) => <Sequence from={from} layout="none">{children}</Sequence>;

const Hook = () => {
  const n = useCurrentFrame();
  const v = Math.round(13500 * f(n, 10, 60));
  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", fontFamily: font, gap: 12 }}>
      <div style={{ fontSize: 34, color: DIM, opacity: f(n, 0, 15) }}>Three vulnerable dependencies put this at risk</div>
      <div style={{ fontSize: 130, fontWeight: 800, color: v > 0 && n < 100 ? RED : GREEN }}>{n < 100 ? `$${v.toLocaleString()}` : "$0"}<span style={{ fontSize: 40, color: DIM, fontWeight: 500 }}> /day</span></div>
      <div style={{ fontSize: 40, color: INK, fontWeight: 700, opacity: f(n, 100, 125), textAlign: "center" }}>Fixed in 22 seconds. Tests pass. 0 vulnerabilities left.</div>
      <div style={{ fontSize: 28, color: BLUE, fontWeight: 600, marginTop: 14, opacity: f(n, 130, 150) }}>Blast Radius · Team Redemption · #neatHack</div>
      <div style={{ fontSize: 18, color: DIM, opacity: f(n, 140, 160) }}>Demo data. Revenue-at-risk comes from a file the customer fills in.</div>
    </AbsoluteFill>
  );
};

const runLines = [
  { t: 0.3, c: DIM, s: "$ python -m agent.run --mode entire" },
  { t: 1.2, c: INK, s: "scan  requirements.txt via OSV.dev  →  3 vulnerable packages, 34 advisories" },
  { t: 2.4, c: BLUE, s: "entire graph  →  shop/render.py (Jinja2) · shop/tax.py (requests)" },
  { t: 3.6, c: INK, s: "[1] write_file  requirements.txt   ✓" },
  { t: 4.8, c: GREEN, s: "[2] write_file  shop/render.py     ✓  Markup/escape moved to markupsafe" },
  { t: 6.0, c: INK, s: "[3] install_requirements           ✓  exit 0" },
  { t: 7.0, c: INK, s: "[4] run_tests                      ✓  4 passed" },
  { t: 8.2, c: GREEN, s: "OSV re-scan  →  0 vulnerabilities left      22.4 s · ~$0.044 est." },
];
const AgentRun = () => {
  const n = useCurrentFrame();
  return (
    <div style={{ width: "100%", background: CARD, borderRadius: 12, border: `1px solid ${LINE}`, padding: "28px 34px", fontFamily: mono, fontSize: 21, lineHeight: 1.85 }}>
      {runLines.map((l, i) => (
        <div key={i} style={{ color: l.c, opacity: f(n, dur(l.t), dur(l.t) + 8), fontWeight: i === runLines.length - 1 ? 700 : 400 }}>{l.s}</div>
      ))}
      <div style={{ marginTop: 14, color: DIM, fontSize: 18, fontFamily: font }}>Real run, claude-sonnet-4.6. Cost is an estimate from token counts.</div>
    </div>
  );
};

const GraphTerminal = () => {
  const n = useCurrentFrame();
  const lines = [
    { c: DIM, t: '$ entire graph search --query "code that imports jinja2 Markup and escape" --format agent' },
    { c: INK, t: "1. shop/render.py:13-16  render_receipt   s=16.9" },
    { c: GREEN, t: '     safe_note = Markup(note) if note.startswith("<em>") else escape(note)' },
    { c: INK, t: "2. shop/checkout.py:2-5   (imports render_receipt)" },
    { c: BLUE, t: "4. tests/test_shop.py:16  test_receipt_escapes_untrusted_note   (covering test)" },
    { c: DIM, t: "VERIFY: python -m py_compile shop/render.py" },
  ];
  return (
    <div style={{ width: "100%", background: CARD, borderRadius: 12, border: `1px solid ${LINE}`, padding: "30px 34px", fontFamily: mono, fontSize: 21, lineHeight: 1.75 }}>
      {lines.map((l, i) => <div key={i} style={{ color: l.c, opacity: f(n, 8 + i * 12, 20 + i * 12) }}>{l.t}</div>)}
    </div>
  );
};

const Bars = () => {
  const n = useCurrentFrame();
  const data = [["LLM steps", 19.7, 4.3], ["Tool calls", 36.3, 5.3], ["Est. cost / run", 0.199, 0.041], ["Time (s)", 48.4, 18.5]];
  return (
    <div style={{ width: "100%", padding: "10px 40px" }}>
      <div style={{ display: "flex", gap: 28, marginBottom: 22, fontSize: 22, color: DIM }}><span><b style={{ color: RED }}>■</b> naive agent</span><span><b style={{ color: GREEN }}>■</b> improved agent</span></div>
      {data.map(([k, a, b]: any, i) => {
        const t = f(n, 8 + i * 10, 40 + i * 10);
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
            <div style={{ width: 230, color: INK, fontSize: 26 }}>{k}</div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 24, width: `${t * 100}%`, background: RED, borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 24, width: `${t * (b / a) * 100}%`, background: GREEN, borderRadius: 4 }} />
            </div>
            <div style={{ width: 190, color: GREEN, fontSize: 26, fontWeight: 700, textAlign: "right", opacity: t }}>−{Math.round((1 - b / a) * 100)}%</div>
          </div>
        );
      })}
    </div>
  );
};

const events = [
  { ok: true, t: "write_file  requirements.txt → requests==2.33.0" },
  { ok: false, t: "install_requirements  ✗ requests 2.33.0 needs Python ≥ 3.10 (project runs 3.9)" },
  { ok: true, t: "write_file  requirements.txt → compatible version" },
  { ok: true, t: "install_requirements  ✓ exit 0" },
  { ok: true, t: "run_tests  ✓ 1 passed" },
];
const Recovery = ({ d }: any) => {
  const n = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 22, width: "100%", height: "100%" }}>
      <div style={{ flex: 1.45 }}><Shot src="failure-recovery-trace.jpg" d={d} zoom={0.03} /></div>
      <div style={{ flex: 1, background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px", fontFamily: mono, fontSize: 18, lineHeight: 1.5 }}>
        <div style={{ color: DIM, fontFamily: font, fontSize: 18, marginBottom: 12 }}>Recovery point (real repo: Snehasis5/ci-cd-demo)</div>
        {events.map((e, i) => <div key={i} style={{ color: e.ok ? INK : RED, marginBottom: 14, opacity: f(n, 15 + i * 22, 30 + i * 22), fontWeight: e.ok ? 400 : 700 }}>{i + 1}. {e.t}</div>)}
      </div>
    </div>
  );
};

const sessions = [
  { id: "oss-funkaoshi_osr-opml", steps: 5, tok: "16.9k", note: "lxml → 6.1.0 · 18 tests pass", bad: false },
  { id: "oss-apqlzm_scraposer", steps: 5, tok: "25.3k", note: "requests + lxml · tests pass", bad: false },
  { id: "oss-Snehasis5_ci-cd-demo", steps: 6, tok: "7.5k", note: "1 failed action → recovered · tests pass", bad: true },
  { id: "oss-kapihllkumar_my-blog-practice", steps: 5, tok: "5.6k", note: "requests → 2.32.5 · tests pass", bad: false },
];
const RealSessions = () => {
  const n = useCurrentFrame();
  return (
    <div style={{ width: "100%", background: CARD, borderRadius: 12, border: `1px solid ${LINE}`, padding: "24px 30px", fontFamily: mono, fontSize: 19 }}>
      <div style={{ color: DIM, fontFamily: font, fontSize: 20, marginBottom: 14 }}>neatlogs sessions, one per real open-source repo (workflow: blast-radius-oss)</div>
      {sessions.map((x, i) => (
        <div key={x.id} style={{ display: "grid", gridTemplateColumns: "2.3fr 0.7fr 0.8fr 2fr", gap: 14, padding: "13px 0", borderBottom: `1px solid ${LINE}`, opacity: f(n, 8 + i * 12, 22 + i * 12), color: x.bad ? RED : INK }}>
          <div style={{ fontWeight: 700 }}>{x.id}</div><div>{x.steps} steps</div><div>{x.tok} tok</div><div style={{ color: x.bad ? RED : GREEN }}>{x.note}</div>
        </div>
      ))}
      <div style={{ marginTop: 16, color: DIM, fontFamily: font, fontSize: 18, opacity: f(n, 70, 90) }}>Values read from the neatlogs session outputs. Token cost is an estimate.</div>
    </div>
  );
};

const SnapshotTerminal = () => {
  const n = useCurrentFrame();
  const lines = [
    { c: DIM, t: "$ entire graph snapshot --repo . --format ndjson" },
    { c: INK, t: "70 files · 723 symbols · 1,655 relations · 166 external refs" },
    { c: GREEN, t: "local only, no egress. The same graph the agent queries." },
    { c: DIM, t: "$ entire checkpoint list" },
    { c: INK, t: "28 checkpoints on main. Every commit is tied to the session that made it." },
  ];
  return (
    <div style={{ width: "100%", background: CARD, borderRadius: 12, border: `1px solid ${LINE}`, padding: "30px 34px", fontFamily: mono, fontSize: 22, lineHeight: 1.9 }}>
      {lines.map((l, i) => <div key={i} style={{ color: l.c, opacity: f(n, 8 + i * 14, 22 + i * 14) }}>{l.t}</div>)}
    </div>
  );
};

const rows = [
  ["funkaoshi/osr-opml", "lxml 4.9.3 → 6.1.0", "lxml 4.9.3 → 6.1.0", "same"],
  ["apqlzm/scraposer", "lxml 4.6.5 → 4.9.1", "requests → 2.32.5 + lxml → 6.1.0", "more complete"],
  ["Snehasis5/ci-cd-demo", "requests 2.19.0 → 2.32.3", "requests 2.19.0 → 2.32.5", "same / newer"],
  ["kapihllkumar/my-blog-practice", "requests 2.19.1 → 2.32.2", "requests 2.19.1 → 2.32.5", "same / newer"],
];
const Replay = () => {
  const n = useCurrentFrame();
  const cols = "1.5fr 1.4fr 1.7fr 0.9fr";
  const Cell = ({ children, color = INK, bold = false }: any) => <div style={{ color, fontWeight: bold ? 700 : 400 }}>{children}</div>;
  return (
    <div style={{ width: "100%", background: CARD, borderRadius: 12, border: `1px solid ${LINE}`, padding: "26px 34px", fontSize: 21 }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16, paddingBottom: 12, borderBottom: `1px solid ${LINE}` }}>
        {["Real repo", "Maintainer's Dependabot fix", "Our agent's fix", "vs human"].map((h) => <Cell key={h} color={DIM} bold>{h}</Cell>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: cols, gap: 16, padding: "16px 0", borderBottom: "1px solid #1b2338", opacity: f(n, 10 + i * 16, 26 + i * 16) }}>
          <Cell bold>{r[0]}</Cell><Cell color={DIM}>{r[1]}</Cell><Cell>{r[2]}</Cell><Cell color={GREEN} bold>{r[3]} ✓ tests pass</Cell>
        </div>
      ))}
      <div style={{ marginTop: 20, color: DIM, fontSize: 19, opacity: f(n, 90, 110) }}>
        Only 6 of 51 old repos could be rebuilt and pass their own tests. What stays blocked needs Python 3.10+; the agent reports it as blocked.
      </div>
    </div>
  );
};

const CfoStats = ({ d }: any) => {
  const n = useCurrentFrame();
  const stat = (big: string, small: string, color: string, i: number) => (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "16px 18px", marginBottom: 14, opacity: f(n, 20 + i * 18, 38 + i * 18) }}>
      <div style={{ fontSize: 44, fontWeight: 800, color }}>{big}</div><div style={{ fontSize: 18, color: DIM, lineHeight: 1.3 }}>{small}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 20, width: "100%", height: "100%" }}>
      <div style={{ flex: 2.3 }}><Shot src="cfo-revenue-cash-charts.jpg" d={d} zoom={0.04} /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {stat("~82%", "overage margin, improved agent, 20× real-repo stress", GREEN, 0)}
        {stat("~14%", "same conditions, naive agent", RED, 1)}
        {stat("$15 / $25", "per repo / month, 1–2 fixes included, $7 extra (draft)", BLUE, 2)}
      </div>
    </div>
  );
};

const End = () => {
  const n = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", fontFamily: font, gap: 14 }}>
      <div style={{ fontSize: 80, fontWeight: 800, color: INK, opacity: f(n, 0, 20) }}>Blast Radius</div>
      <div style={{ fontSize: 30, color: DIM, opacity: f(n, 15, 35) }}>See what a change puts at risk. Fix the part we can.</div>
      <div style={{ display: "flex", gap: 18, marginTop: 18, opacity: f(n, 40, 60) }}>
        {["neatlogs: traced every run", "Entire: graph + checkpoints", "cfo.ai: pricing + runway"].map((t) => (
          <div key={t} style={{ color: BLUE, border: `1px solid ${BLUE}`, borderRadius: 99, padding: "8px 18px", fontSize: 22, fontWeight: 600 }}>{t}</div>
        ))}
      </div>
      <div style={{ fontSize: 24, color: INK, marginTop: 26, opacity: f(n, 70, 90) }}>github.com/Axhat/neatlogs-hack</div>
      <div style={{ fontSize: 24, color: INK, opacity: f(n, 80, 100) }}>Try it: 100.31.116.240/onboard (AWS us-east-1)</div>
      <div style={{ fontSize: 19, color: DIM, marginTop: 6, opacity: f(n, 90, 110) }}>Demo data. Costs are estimates. Small samples. Prototype onboarding. #neatHack</div>
    </AbsoluteFill>
  );
};

type SceneDef = { sec: number; render: (d: number) => any };
const scenes: Record<string, SceneDef> = {
  hook: { sec: 6, render: () => <Hook /> },
  run: { sec: 12, render: (d) => (
    <Scene dur={d} title="1. One real run" caption={<>The agent scans, finds the files, upgrades, fixes the code that breaks, runs the tests, and an independent scan confirms.</>}>
      <AgentRun />
    </Scene>) },
  dash: { sec: 10, render: (d) => (
    <Scene dur={d} title="2. What the buyer sees" caption={<>Code → packages → features → revenue. <b style={{ color: RED }}>$13,500/day at risk</b> before; <b style={{ color: GREEN }}>$0</b> after (demo data).</>}>
      <Slides srcs={["dash-before.jpg", "dash-after.jpg"]} d={d} />
    </Scene>) },
  neat: { sec: 14, render: (d) => (
    <Scene dur={d} tool="neatlogs" title="3. Tracing the agent" caption={<>The first trace showed the agent re-reading the same files for every package (56 → 16 spans). Same task, 3 runs each, tests pass 3/3. Costs are estimates.</>}>
      <Switch parts={[{ from: 0, to: 6.5, node: <div style={{ display: "flex", gap: 20, width: "100%", height: "100%" }}><div style={{ flex: 1 }}><Shot src="trace-baseline.jpg" d={190} zoom={0.03} /></div><div style={{ flex: 1 }}><Shot src="trace-improved.jpg" d={190} zoom={0.03} /></div></div> }, { from: 6.5, to: 14, node: <Bars /> }]} />
    </Scene>) },
  fail: { sec: 10, render: (d) => (
    <Scene dur={d} tool="neatlogs" title="4. When an action fails" caption={<>A real failure: the install broke. The agent read the error, switched to a version the project can run, and the tests passed. Now it picks that version up front.</>}>
      <Recovery d={d} />
    </Scene>) },
  entire: { sec: 16, render: (d) => (
    <Scene dur={d} tool="Entire" title="5. Graph, snapshot and checkpoints" caption={<>Graph finds the file and its covering test in ~260 ms, a snapshot maps the whole repo, and each commit is tied to its session: checkpoint <b>01M4JYYTA9J94PDTA97JDYS36X</b>.</>}>
      <Switch parts={[{ from: 0, to: 5, node: <GraphTerminal /> }, { from: 5, to: 10, node: <SnapshotTerminal /> }, { from: 10, to: 16, node: <div style={{ width: "100%", height: "100%" }}><Shot src="entire-checkpoint.jpg" d={180} zoom={0.04} /></div> }]} />
    </Scene>) },
  live: { sec: 15, render: (d) => (
    <Scene dur={d} title="3. Live on AWS (us-east-1)" caption={<>The deployed app at <b>100.31.116.240</b>: <b style={{ color: RED }}>$13,500/day at risk</b>, then <b style={{ color: GREEN }}>$0</b> after the fix (demo data). Onboarding scans a real GitHub repo live.</>}>
      <Slides srcs={["live-before.jpg", "live-after.jpg", "live-onboard.jpg"]} d={d} />
    </Scene>) },
  realneat: { sec: 14, render: (d) => (
    <Scene dur={d} tool="neatlogs" title="4. neatlogs on a real repo: failure and recovery" caption={<>On real repos the agent hit a failure: the install broke at step 2. neatlogs recorded it, and the agent resumed from that point with a version the project can run. Tests passed.</>}>
      <Switch parts={[{ from: 0, to: 5, node: <RealSessions /> }, { from: 5, to: 14, node: <Recovery d={270} /> }]} />
    </Scene>) },
  replay: { sec: 10, render: (d) => (
    <Scene dur={d} title="6. Does it work on real code?" caption={<>We rewound real repos to just before maintainers merged a fix, ran the agent, and compared. Tests pass; it matched or beat the human fix.</>}>
      <Replay />
    </Scene>) },
  onboard: { sec: 11, render: (d) => (
    <Scene dur={d} title="7. Onboarding a buyer" caption={<>Paste a repo URL → see the blast radius → confirm suggested owners and features (we never guess your revenue) → choose how much to trust the agent. Prototype.</>}>
      <Slides srcs={["onboard-2-blast-radius.jpg", "onboard-3-context.jpg", "onboard-4-trust.jpg"]} d={d} />
    </Scene>) },
  cfo: { sec: 10, render: (d) => (
    <Scene dur={d} tool="cfo.ai" title="8. Can it be a business?" caption={<>cfo.ai turns the measured cost per fix into pricing, revenue and cash paths at 10–20× real-repo stress. Draft assumptions, not predictions.</>}>
      <CfoStats d={d} />
    </Scene>) },
  end: { sec: 8, render: () => <End /> },
};

const FULL = ["hook", "run", "live", "neat", "realneat", "entire", "replay", "onboard", "cfo", "end"];
const SHORT = ["hook", "run", "neat", "replay", "cfo", "end"];
const SHORT_SEC: Record<string, number> = { hook: 5, run: 9, neat: 8, replay: 8, cfo: 7, end: 6 };

const build = (order: string[], override: Record<string, number> = {}) => {
  const total = order.reduce((a, k) => a + dur(override[k] ?? scenes[k].sec), 0);
  const C = () => {
    let at = 0;
    return (
      <AbsoluteFill style={{ background: BG }}>
        {order.map((k) => {
          const d = dur(override[k] ?? scenes[k].sec);
          const from = at; at += d;
          return <Sequence key={k} from={from} durationInFrames={d}>{scenes[k].render(d)}</Sequence>;
        })}
      </AbsoluteFill>
    );
  };
  return { C, total };
};
const full = build(FULL), short = build(SHORT, SHORT_SEC);
export const Demo = full.C;
export const DEMO_FRAMES = full.total;
export const Short = short.C;
export const SHORT_FRAMES = short.total;
