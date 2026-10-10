import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const BG = "#0b0f1a", INK = "#e8ecf4", DIM = "#8a94a8", RED = "#ff4d5e", GREEN = "#2fd27a", BLUE = "#5b8cff";
const font = "Inter, -apple-system, Helvetica, Arial, sans-serif";
const ease = Easing.out(Easing.cubic);
const f = (frame: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(frame, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const fade = (frame: number, a: number, b: number) => Math.min(f(frame, a, a + 15), 1 - f(frame, b - 15, b));

const Text = ({ children, size = 56, color = INK, weight = 700, style = {} }: any) => (
  <div style={{ fontFamily: font, fontSize: size, color, fontWeight: weight, textAlign: "center", ...style }}>{children}</div>
);

// Scene 1: 0-120
const S1 = ({ frame }: any) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade(frame, 0, 120), gap: 18 }}>
    <Text size={58}>Every company runs on software</Text>
    <Text size={58} color={BLUE}>it didn’t write.</Text>
    <Text size={26} color={DIM} weight={400} style={{ opacity: f(frame, 50, 80), marginTop: 20 }}>
      When a dependency is vulnerable, who finds out what breaks, and what it costs?
    </Text>
  </AbsoluteFill>
);

// Scene 2: 105-300 — graph forms, nodes turn red
type N = { id: string; x: number; y: number; label: string; sub?: string };
const nodes: N[] = [
  { id: "shop", x: 180, y: 360, label: "Mugly shop" },
  { id: "checkout", x: 470, y: 180, label: "checkout" },
  { id: "tax", x: 470, y: 360, label: "tax", sub: "$12,000/day at risk" },
  { id: "receipts", x: 470, y: 540, label: "receipts", sub: "$1,500/day at risk" },
  { id: "requests", x: 800, y: 360, label: "requests 2.25.1", sub: "8 advisories" },
  { id: "jinja", x: 800, y: 540, label: "Jinja2 2.11.2", sub: "10 advisories" },
  { id: "urllib3", x: 1100, y: 360, label: "urllib3 1.26.18" },
];
const edges = [["shop", "checkout"], ["shop", "tax"], ["shop", "receipts"], ["tax", "requests"], ["receipts", "jinja"], ["requests", "urllib3"]];
const vuln = new Set(["requests", "jinja", "urllib3"]);
const pos = (id: string) => nodes.find((n) => n.id === id)!;

const Graph = ({ frame, fixedAt }: any) => (
  <AbsoluteFill>
    <svg width={1280} height={720}>
      {edges.map(([a, b], i) => {
        const p = pos(a), q = pos(b), t = f(frame, 15 + i * 8, 40 + i * 8);
        return <line key={i} x1={p.x} y1={p.y} x2={p.x + (q.x - p.x) * t} y2={p.y + (q.y - p.y) * t} stroke="#2a3350" strokeWidth={3} />;
      })}
      {nodes.map((n, i) => {
        const show = f(frame, 8 + i * 8, 28 + i * 8);
        const isV = vuln.has(n.id);
        const redT = isV ? f(frame, 90, 110) : 0;
        const greenT = isV ? f(frame, fixedAt, fixedAt + 20) : 0;
        const c = greenT > 0.5 ? GREEN : redT > 0.5 ? RED : BLUE;
        return (
          <g key={n.id} opacity={show} transform={`translate(${n.x},${n.y}) scale(${0.6 + 0.4 * show})`}>
            <circle r={isV ? 46 : 38} fill={c} opacity={0.2} />
            <circle r={isV ? 28 : 22} fill={c} />
            <text y={-58} textAnchor="middle" fill={INK} fontFamily={font} fontSize={24} fontWeight={600}>{n.label}</text>
            {n.sub && <text y={64} textAnchor="middle" fill={greenT > 0.5 && isV ? GREEN : DIM} fontFamily={font} fontSize={20}>{greenT > 0.5 && isV ? "fixed · tests pass" : n.sub}</text>}
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);

const S2 = ({ frame }: any) => (
  <AbsoluteFill style={{ opacity: fade(frame, 0, 300) }}>
    <Graph frame={frame} fixedAt={240} />
    <div style={{ position: "absolute", top: 40, width: "100%" }}>
      <Text size={34} color={frame < 100 ? INK : frame < 235 ? RED : GREEN}>
        {frame < 100 ? "Blast Radius maps code → packages → features → revenue" : frame < 235 ? "3 vulnerable dependencies. Here’s what each one touches." : "An agent fixes it. Tests stay green."}
      </Text>
    </div>
    <div style={{ position: "absolute", bottom: 26, width: "100%" }}>
      <Text size={18} color={DIM} weight={400}>Demo data · revenue-at-risk figures are customer-supplied inputs</Text>
    </div>
  </AbsoluteFill>
);

// Scene 3: 0-210 — before/after bars
const rows = [
  { k: "LLM steps", a: 19.7, b: 4.3, fa: "19.7", fb: "4.3" },
  { k: "Tool calls", a: 36.3, b: 5.3, fa: "36.3", fb: "5.3" },
  { k: "Est. cost / run", a: 0.199, b: 0.041, fa: "$0.199", fb: "$0.041" },
  { k: "Time", a: 48.4, b: 18.5, fa: "48s", fb: "18.5s" },
];
const S3 = ({ frame }: any) => (
  <AbsoluteFill style={{ opacity: fade(frame, 0, 210), padding: "50px 120px" }}>
    <Text size={40} style={{ marginBottom: 10 }}>Traced with neatlogs. Fixed from the trace.</Text>
    <Text size={22} color={DIM} weight={400} style={{ marginBottom: 34 }}>Naive agent vs improved agent · same task · 3 runs each · tests pass 3/3 both</Text>
    {rows.map((r, i) => {
      const t = f(frame, 20 + i * 14, 60 + i * 14);
      return (
        <div key={r.k} style={{ display: "flex", alignItems: "center", marginBottom: 26, fontFamily: font }}>
          <div style={{ width: 230, color: INK, fontSize: 26 }}>{r.k}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              <div style={{ height: 22, width: `${t * 100}%`, background: RED, borderRadius: 4 }} />
              <span style={{ color: DIM, marginLeft: 12, fontSize: 22, opacity: t }}>{r.fa}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ height: 22, width: `${t * (r.b / r.a) * 100}%`, background: GREEN, borderRadius: 4 }} />
              <span style={{ color: INK, marginLeft: 12, fontSize: 22, opacity: t }}>{r.fb} ({Math.round((1 - r.b / r.a) * 100)}% less)</span>
            </div>
          </div>
        </div>
      );
    })}
  </AbsoluteFill>
);

// Scene 4: 0-150 — title
const S4 = ({ frame }: any) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade(frame, 0, 150), gap: 16 }}>
    <Text size={92}>Blast Radius</Text>
    <Text size={34} color={DIM} weight={400}>What does a change put at risk? We tell you, and fix it.</Text>
    <Text size={26} color={BLUE} weight={600} style={{ marginTop: 28, opacity: f(frame, 40, 70) }}>neatlogs · Entire · cfo.ai</Text>
    <Text size={24} color={DIM} weight={400} style={{ opacity: f(frame, 60, 90) }}>Team Redemption · #neatHack</Text>
  </AbsoluteFill>
);

export const Intro = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG }}>
      {frame < 120 && <S1 frame={frame} />}
      {frame >= 105 && frame < 405 && <S2 frame={frame - 105} />}
      {frame >= 390 && frame < 600 && <S3 frame={frame - 390} />}
      {frame >= 585 && <S4 frame={frame - 585} />}
    </AbsoluteFill>
  );
};
