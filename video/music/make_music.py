"""Original 25s synthwave/EDM-style backing track for the intro video (numpy only, no samples)."""
import wave
import numpy as np

SR, DUR, BPM = 44100, 25.0, 128
BEAT = 60 / BPM
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def lp(x, n):  # cheap low-pass: moving average
    return np.convolve(x, np.ones(n) / n, mode="same")


def saw(f, tt):
    return 2 * ((f * tt) % 1.0) - 1


def place(buf, sig, start):
    i = int(start * SR)
    e = min(N, i + len(sig))
    if i < N:
        buf[i:e] += sig[: e - i]


chords = [  # (bass root, triad) : Am F C G, 8 beats each
    (55.00, [220.00, 261.63, 329.63]),
    (43.65, [174.61, 220.00, 261.63]),
    (65.41, [261.63, 329.63, 392.00]),
    (49.00, [196.00, 246.94, 293.66]),
]
CHORD_LEN = 8 * BEAT
kick_times = [4.0 + k * BEAT for k in range(int((DUR - 4.0 - 1.5) / BEAT))]

# --- pad (whole track), ducked by the kick
pad = np.zeros(N)
for ci in range(int(DUR / CHORD_LEN) + 1):
    s, e = ci * CHORD_LEN, min(DUR, (ci + 1) * CHORD_LEN + 0.6)
    if s >= DUR:
        break
    _, tri = chords[ci % 4]
    seg_t = np.arange(int((e - s) * SR)) / SR
    env = np.minimum(seg_t / 0.8, 1) * np.minimum((e - s - seg_t) / 0.6, 1).clip(0, 1)
    v = sum(saw(f * d, seg_t) for f in tri for d in (0.997, 1.003))
    place(pad, lp(v, 60) * env * 0.05, s)

# --- kick
kick = np.zeros(N)
kt = np.arange(int(0.3 * SR)) / SR
k_env = np.exp(-kt * 14)
k_sig = np.sin(2 * np.pi * (45 * kt + 105 * (1 - np.exp(-kt * 30)) / 30)) * k_env
for s in kick_times:
    place(kick, k_sig * 0.9, s)

# --- hats on off-beats
hat = np.zeros(N)
ht = np.arange(int(0.05 * SR)) / SR
h_sig = np.diff(rng.standard_normal(len(ht) + 1)) * np.exp(-ht * 90) * 0.12
for s in kick_times:
    place(hat, h_sig, s + BEAT / 2)

# --- bass (8th notes, 4.0s on)
bass = np.zeros(N)
for s in np.arange(4.0, DUR - 1.5, BEAT / 2):
    root = chords[int(s // CHORD_LEN) % 4][0]
    bt = np.arange(int(BEAT / 2 * SR)) / SR
    place(bass, lp(saw(root, bt) + saw(root * 2.003, bt) * 0.4, 40) * np.exp(-bt * 5) * 0.55, s)

# --- arpeggio (16ths, 8.0s -> 22.0s)
arp = np.zeros(N)
step = BEAT / 4
for j, s in enumerate(np.arange(8.0, 22.0, step)):
    tri = chords[int(s // CHORD_LEN) % 4][1]
    f = [tri[0], tri[1], tri[2], tri[1] * 2, tri[2], tri[1], tri[0] * 2, tri[1]][j % 8] * 2
    at = np.arange(int(step * 1.6 * SR)) / SR
    place(arp, lp(saw(f, at) + saw(f * 1.004, at), 14) * np.exp(-at * 14) * 0.18, s)

# duck pad + arp under the kick
duck = np.ones(N)
dt = np.arange(int(BEAT * SR)) / SR
d_env = 1 - 0.55 * np.exp(-dt * 9)
for s in kick_times:
    i = int(s * SR)
    seg = min(len(dt), N - i)
    duck[i:i + seg] = np.minimum(duck[i:i + seg], d_env[:seg])

mix = pad * duck + arp * duck + kick + hat + bass
# riser into the final scene (noise sweep 18.5 -> 20.0s)
ri = (t >= 18.5) & (t < 20.0)
mix[ri] += np.diff(rng.standard_normal(N + 1))[ri] * ((t[ri] - 18.5) / 1.5) ** 2 * 0.05

fade = np.minimum(t / 0.6, 1) * np.minimum((DUR - t) / 2.0, 1)
mix *= fade
mix = np.tanh(mix * 1.4)
mix = mix / np.abs(mix).max() * 0.7  # ~ -3 dBFS
stereo = np.stack([mix, np.roll(mix, 40)], axis=1)  # tiny Haas width
with wave.open("video/out/music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype("<i2").tobytes())
print("ok")
