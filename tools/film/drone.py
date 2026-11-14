# A tanpura-style drone for the film, synthesized from scratch (no samples): drone.py out.wav seconds [swell_start swell_end]
# Four strings plucked in the classic cycle Pa, Sa, Sa, low Sa. Each pluck is additive: many harmonics, with the
# tanpura's moving bright band (the "jawari" buzz) sweeping up through them after each pluck. Under it a soft low pad,
# then a long, dark reverb.
import sys, wave, numpy as np
out, DUR = sys.argv[1], float(sys.argv[2])
SW = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else None
SR = 48000; N = int(DUR * SR) + SR * 4
rng = np.random.default_rng(7)
SA = 130.81
STR = [('pa', SA * 3 / 4, -.35, 1.0), ('sa1', SA * 2 ** (.6 / 1200), .28, .85), ('sa2', SA * 2 ** (-.6 / 1200), -.12, .85), ('kharaj', SA / 2, .05, 1.1)]

def pluck(f, L=9.0, seed=0):
    r = np.random.default_rng(seed); t = np.arange(int(L * SR)) / SR
    y = np.zeros_like(t); nmax = int(7000 / f)
    c = 3 + 24 * (1 - np.exp(-t / 1.6))                    # the bright band climbs the harmonics
    tau = 3.6 * (130 / f) ** .25
    for n in range(1, nmax + 1):
        g = n ** -.95 * (1 + 2.6 * np.exp(-((n - c) ** 2) / (2 * 2.4 ** 2)))
        env = np.exp(-t / (tau / (1 + .035 * n)))
        y += g * env * np.sin(2 * np.pi * n * f * t * (1 + 2e-5 * n) + r.uniform(0, 6.283))
    y *= np.minimum(1, t / .006)                           # a soft attack
    y *= np.clip((L - t) / 2.5, 0, 1) ** 2                 # and a tail that dies away instead of stopping
    return y / np.abs(y).max()

P = {s[0]: [pluck(s[1], seed=i * 10 + k) for k in range(3)] for i, s in enumerate(STR)}
L = np.zeros(N); R = np.zeros(N)
cycle, offs = 4.6, [0, 1.15, 2.1, 3.05]
t0 = .3
while t0 < DUR:
    for (name, f, pan, amp), o in zip(STR, offs):
        at = t0 + o + rng.normal(0, .025)
        if at >= DUR - 1.5: continue
        y = P[name][rng.integers(3)] * amp * rng.uniform(.85, 1.0); i = int(at * SR); j = min(N, i + len(y))
        L[i:j] += y[:j - i] * np.sqrt((1 - pan) / 2); R[i:j] += y[:j - i] * np.sqrt((1 + pan) / 2)
    t0 += cycle
L *= .22; R *= .22

# the low pad: Sa and its octave below, breathing slowly; and a swell of Sa, Pa and high Sa for the closing pull-back
t = np.arange(N) / SR
pad = (np.sin(2 * np.pi * SA / 2 * t) * .5 + np.sin(2 * np.pi * SA * t + 1) * .25 + np.sin(2 * np.pi * SA * 1.5 * t + 2) * .08) * (.75 + .25 * np.sin(2 * np.pi * t / 19))
pad *= .05
if SW:
    s = np.clip((t - SW[0]) / (SW[1] - SW[0]), 0, 1); s = s * s * (3 - 2 * s)
    k = np.exp(-np.maximum(0, t - SW[1]) / 6)
    sw = (np.sin(2 * np.pi * SA * 2 * t) * .3 + np.sin(2 * np.pi * SA * 3 * t + .5) * .14 + np.sin(2 * np.pi * SA * 4 * t + 1.3) * .08)
    pad += sw * s * k * .09
L += pad; R += pad

# reverb: a long, darkening tail of noise, a little different in each ear
def ir(seed):
    r = np.random.default_rng(seed); n = int(3.8 * SR); tt = np.arange(n) / SR
    x = r.standard_normal(n) * np.exp(-tt / .9)
    for _ in range(3): x = np.convolve(x, np.ones(6) / 6, mode='same')   # darker
    x[:int(.012 * SR)] = 0; return x / np.sqrt((x ** 2).sum())
def conv(a, b):
    m = len(a) + len(b) - 1; n = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(a, n) * np.fft.rfft(b, n), n)[:len(a)]
wL, wR = conv(L, ir(1)), conv(R, ir(2))
L, R = L * .72 + wL * .55, R * .72 + wR * .55

# fade in and out with the picture
env = np.clip(t / 3.5, 0, 1) ** 2 * np.clip((DUR - t) / 3.5, 0, 1) ** 1.5
L *= env; R *= env
M = int(DUR * SR); L, R = L[:M], R[:M]
peak = max(np.abs(L).max(), np.abs(R).max()); g = 10 ** (-3 / 20) / peak
pcm = (np.stack([L, R], 1) * g * 32767).astype('<i2')
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
rms = np.sqrt(((np.stack([L, R], 1) * g) ** 2).mean()); print('written', out, 'seconds', DUR, 'rms dBFS', round(20 * np.log10(rms), 1))
