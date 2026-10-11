import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";

const BG = "#0b0f1a", INK = "#e8ecf4", DIM = "#8a94a8", RED = "#ff4d5e", GREEN = "#2fd27a", BLUE = "#5b8cff", CARD = "#131a2b";
const font = "Inter, -apple-system, Helvetica, Arial, sans-serif";
const mono = "SF Mono, Menlo, Consolas, monospace";
const ease = Easing.out(Easing.cubic);
const f = (n: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(n, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// A scene wrapper: fade in/out, top label, bottom caption.
const Scene = ({ dur, tool, title, caption, children }: any) => {
  const n = useCurrentFrame();
  const op = Math.min(f(n, 0, 12), 1 - f(n, dur - 12, dur));
  return (
    <AbsoluteFill style={{ background: BG, opacity: op, fontFamily: font }}>
      <div style={{ position: "absolute", top: 22, left: 40, right: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: INK, fontSize: 30, fontWeight: 700 }}>{title}</div>
        {tool && <div style={{ color: BLUE, fontSize: 20, fontWeight: 600, border: `1px solid ${BLUE}`, borderRadius: 99, padding: "4px 14px" }}>{tool}</div>}
      </div>
      <div style={{ position: "absolute", top: 76, left: 40, right: 40, bottom: 110, display: "flex", justifyContent: "center", alignItems: "center" }}>{children}</div>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 22, color: INK, fontSize: 25, lineHeight: 1.35, textAlign: "center" }}>{caption}</div>
    </AbsoluteFill>
  );
};

const Shot = ({ src, dur, zoom = 0.05 }: any) => {
  const n = useCurrentFrame();
  const s = 1 + zoom * (n / dur);
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 12, border: "1px solid #232c45", background: "#000" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "contain", transform: `scale(${s})` }} />
    </div>
  );
};

const S = 30; // fps
const dur = (sec: number) => Math.round(sec * S);

const Title = () => {
  const n = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", fontFamily: font, gap: 14 }}>
      <div style={{ fontSize: 92, fontWeight: 800, color: INK, opacity: f(n, 0, 20) }}>Blast Radius</div>
      <div style={{ fontSize: 34, color: DIM, opacity: f(n, 20, 40), textAlign: "center", maxWidth: 1000 }}>
        What does a vulnerable dependency put at risk, in business terms? Then an agent fixes it.
      </div>
      <div style={{ fontSize: 26, color: BLUE, fontWeight: 600, marginTop: 24, opacity: f(n, 50, 70) }}>neatHack · Team Redemption · neatlogs · Entire · cfo.ai</div>
    </AbsoluteFill>
  );
};

const Terminal = () => {
  const n = useCurrentFrame();
  const lines = [
    { c: DIM, t: '$ entire graph search --query "code that imports jinja2 Markup and escape" --format agent' },
    { c: INK, t: "1. shop/render.py:13-16  render_receipt   s=16.9" },
    { c: GREEN, t: '     safe_note = Markup(note) if note.startswith("<em>") else escape(note)' },
    { c: INK, t: "2. shop/checkout.py:2-5   (imports render_receipt)" },
    { c: INK, t: "3. shop/render.py:1-6     from jinja2 import Environment, Markup, escape" },
    { c: BLUE, t: "4. tests/test_shop.py:16  test_receipt_escapes_untrusted_note   (covering test)" },
    { c: DIM, t: "VERIFY: python -m py_compile shop/render.py" },
  ];
  return (
    <div style={{ width: "100%", background: CARD, borderRadius: 12, border: "1px solid #232c45", padding: "30px 34px", fontFamily: mono, fontSize: 22, lineHeight: 1.75 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ color: l.c, opacity: f(n, 10 + i * 14, 24 + i * 14) }}>{l.t}</div>
      ))}
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
  const cols = ["1.5fr", "1.4fr", "1.7fr", "0.9fr"];
  const Cell = ({ children, color = INK, bold = false }: any) => <div style={{ color, fontWeight: bold ? 700 : 400 }}>{children}</div>;
  return (
    <div style={{ width: "100%", background: CARD, borderRadius: 12, border: "1px solid #232c45", padding: "26px 34px", fontSize: 21 }}>
      <div style={{ display: "grid", gridTemplateColumns: cols.join(" "), gap: 16, paddingBottom: 12, borderBottom: "1px solid #232c45" }}>
        {["Real repo", "Maintainer's Dependabot fix", "Our agent's fix", "vs human"].map((h) => <Cell key={h} color={DIM} bold>{h}</Cell>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: cols.join(" "), gap: 16, padding: "16px 0", borderBottom: "1px solid #1b2338", opacity: f(n, 10 + i * 16, 26 + i * 16) }}>
          <Cell bold>{r[0]}</Cell><Cell color={DIM}>{r[1]}</Cell><Cell>{r[2]}</Cell><Cell color={GREEN} bold>{r[3]} ✓ tests pass</Cell>
        </div>
      ))}
      <div style={{ marginTop: 20, color: DIM, fontSize: 19, opacity: f(n, 90, 110) }}>
        Only 6 of 51 old repos could be rebuilt and pass their own tests. What stays blocked needs Python 3.10+; the agent reports it as blocked.
      </div>
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
      <div style={{ flex: 1.45 }}><Shot src="failure-recovery-trace.jpg" dur={d} zoom={0.03} /></div>
      <div style={{ flex: 1, background: CARD, border: "1px solid #232c45", borderRadius: 12, padding: "22px 22px", fontFamily: mono, fontSize: 18, lineHeight: 1.5 }}>
        <div style={{ color: DIM, fontFamily: font, fontSize: 18, marginBottom: 12 }}>What the agent did (real run)</div>
        {events.map((e, i) => (
          <div key={i} style={{ color: e.ok ? INK : RED, marginBottom: 14, opacity: f(n, 15 + i * 22, 30 + i * 22), fontWeight: e.ok ? 400 : 700 }}>{i + 1}. {e.t}</div>
        ))}
      </div>
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
        return <div key={src} style={{ position: "absolute", inset: 0, opacity: o }}><Shot src={src} dur={per} zoom={0.03} /></div>;
      })}
    </div>
  );
};

const End = () => {
  const n = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", fontFamily: font, gap: 16 }}>
      <div style={{ fontSize: 80, fontWeight: 800, color: INK, opacity: f(n, 0, 20) }}>Blast Radius</div>
      <div style={{ fontSize: 30, color: DIM, opacity: f(n, 15, 35) }}>See what a change puts at risk. Fix the part we can.</div>
      <div style={{ display: "flex", gap: 22, marginTop: 20, opacity: f(n, 40, 60) }}>
        {["neatlogs: traced every run", "Entire: graph + checkpoints", "cfo.ai: pricing + runway"].map((t) => (
          <div key={t} style={{ color: BLUE, border: `1px solid ${BLUE}`, borderRadius: 99, padding: "8px 18px", fontSize: 22, fontWeight: 600 }}>{t}</div>
        ))}
      </div>
      <div style={{ fontSize: 24, color: INK, marginTop: 28, opacity: f(n, 70, 90) }}>github.com/Axhat/neatlogs-hack · live demo on AWS us-east-1</div>
      <div style={{ fontSize: 20, color: DIM, opacity: f(n, 80, 100) }}>Demo data. Costs are estimates. Sample sizes are small. #neatHack</div>
    </AbsoluteFill>
  );
};

const scenes = [
  { sec: 6 }, { sec: 7 }, { sec: 7 }, { sec: 9 }, { sec: 9 }, { sec: 8 }, { sec: 11 }, { sec: 10 }, { sec: 12 }, { sec: 10 }, { sec: 8 },
];
export const DEMO_FRAMES = scenes.reduce((a, s) => a + dur(s.sec), 0);

export const Demo = () => {
  let at = 0;
  const seq = (i: number, node: any) => {
    const from = at, d = dur(scenes[i].sec);
    at += d;
    return <Sequence key={i} from={from} durationInFrames={d}>{node(d)}</Sequence>;
  };
  return (
    <AbsoluteFill style={{ background: BG }}>
      {seq(0, () => <Title />)}
      {seq(1, (d: number) => (
        <Scene dur={d} title="1. The business view" tool="our dashboard (also live on AWS)" caption={<>Code → packages → features → revenue. <b style={{ color: RED }}>$13,500/day at risk</b> across 3 vulnerable packages (demo data).</>}>
          <Shot src="dash-before.jpg" dur={d} />
        </Scene>
      ))}
      {seq(2, (d: number) => (
        <Scene dur={d} title="2. The agent fixes it" tool="our agent" caption={<>It upgrades, patches the code that breaks, runs tests, and an independent OSV re-scan checks. <b style={{ color: GREEN }}>0 vulnerabilities left.</b></>}>
          <Shot src="dash-after.jpg" dur={d} />
        </Scene>
      ))}
      {seq(3, (d: number) => (
        <Scene dur={d} title="3. Finding what a package touches" tool="Entire Graph" caption={<>Entire Graph finds the exact file, and the test that covers it, in about 260 ms. The agent reads only those files.</>}>
          <Terminal />
        </Scene>
      ))}
      {seq(4, (d: number) => (
        <Scene dur={d} title="4. Tracing the agent" tool="neatlogs" caption={<>The first run's trace showed the agent re-reading the same files for every package. Fixing that: 56 → 16 spans.</>}>
          <div style={{ display: "flex", gap: 20, width: "100%", height: "100%" }}>
            <div style={{ flex: 1 }}><Shot src="trace-baseline.jpg" dur={d} zoom={0.03} /></div>
            <div style={{ flex: 1 }}><Shot src="trace-improved.jpg" dur={d} zoom={0.03} /></div>
          </div>
        </Scene>
      ))}
      {seq(5, (d: number) => (
        <Scene dur={d} title="5. Numbers from the traces" tool="neatlogs" caption={<>Same task, 3 runs each, tests pass 3/3 on both. Cost is our estimate from token counts.</>}>
          <Bars />
        </Scene>
      ))}
      {seq(6, (d: number) => (
        <Scene dur={d} title="6. When an action fails" tool="neatlogs (real run)" caption={<>The install failed. The agent read the error, switched to a version the project can run, and the tests passed. Now it picks that version up front.</>}>
          <Recovery d={d} />
        </Scene>
      ))}
      {seq(7, (d: number) => (
        <Scene dur={d} title="7. Does it work on real code?" tool="real open-source replay" caption={<>We rewound to the commit just before real maintainers merged a fix, ran the agent, and compared.</>}>
          <Replay />
        </Scene>
      ))}
      {seq(8, (d: number) => (
        <Scene dur={d} title="8. Onboarding a buyer" tool="prototype" caption={<>Paste a repo URL → see the blast radius → confirm suggested owners and features (we never guess your revenue) → choose how much to trust the agent.</>}>
          <Slides srcs={["onboard-2-blast-radius.jpg", "onboard-3-context.jpg", "onboard-4-trust.jpg"]} d={d} />
        </Scene>
      ))}
      {seq(9, (d: number) => (
        <Scene dur={d} title="9. Can it be a business?" tool="cfo.ai" caption={<>cfo.ai turns the measured cost per fix into pricing, revenue and cash paths: improved agent vs naive at 10–20× real-repo stress. Draft assumptions, not predictions.</>}>
          <Shot src="cfo-revenue-cash-charts.jpg" dur={d} zoom={0.04} />
        </Scene>
      ))}
      {seq(10, (d: number) => (
        <Scene dur={d} title="10. Every change has its session" tool="Entire checkpoints" caption={<>Each commit is tied to the agent session that produced it. Checkpoint ID <b>01M4JYYTA9J94PDTA97JDYS36X</b>.</>}>
          <Shot src="entire-checkpoint.jpg" dur={d} zoom={0.04} />
        </Scene>
      ))}
      <Sequence from={at} durationInFrames={dur(7)}><End /></Sequence>
    </AbsoluteFill>
  );
};
