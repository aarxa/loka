# Find point stars in NASA's Deep Star Maps 2020 (4K, sRGB-converted) and write RA/Dec, brightness and colour.
import sys, json, numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 7000

im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255.0
lin = np.where(im <= 0.04045, im / 12.92, ((im + 0.055) / 1.055) ** 2.4)   # back to linear light
H, W, _ = lin.shape
L = lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)
print('linear luminance: median %.5f  p90 %.5f  p99 %.5f  p99.9 %.4f' % tuple(np.percentile(L, [50, 90, 99, 99.9])))

# local background: block median, upsampled
B = 32
bg = np.median(L.reshape(H // B, B, W // B, B).transpose(0, 2, 1, 3).reshape(H // B, W // B, -1), axis=2)
bg = np.repeat(np.repeat(bg, B, 0), B, 1)
D = np.clip(L - bg, 0, None)

# local maxima (8-neighbourhood, wrapping horizontally)
P = np.pad(D, ((1, 1), (0, 0)), mode='edge'); P = np.pad(P, ((0, 0), (1, 1)), mode='wrap')
c = P[1:-1, 1:-1]
ismax = np.ones_like(c, bool)
for dy in (-1, 0, 1):
    for dx in (-1, 0, 1):
        if dy == 0 and dx == 0:
            continue
        ismax &= c >= P[1 + dy:H + 1 + dy, 1 + dx:W + 1 + dx]
ys, xs = np.nonzero(ismax & (c > 0.012))

# flux in a 5x5 window, colour from the 3x3 core
Dp = np.pad(D, 2, mode='wrap'); linp = np.pad(lin, ((2, 2), (2, 2), (0, 0)), mode='wrap')
flux = np.zeros(len(ys), np.float32); col = np.zeros((len(ys), 3), np.float32)
for dy in range(-2, 3):
    for dx in range(-2, 3):
        flux += Dp[ys + 2 + dy, xs + 2 + dx]
        if abs(dy) <= 1 and abs(dx) <= 1:
            col += linp[ys + 2 + dy, xs + 2 + dx]

order = np.argsort(-flux)[:60000]
# non-maximum suppression on the sphere: saturated stars have flat tops, and near the poles one star
# smears across many pixels, so keep one detection per star by angular distance
rad = np.radians
RA = rad((0.5 - (xs + 0.5) / W) * 360.0); DE = rad(90.0 - (ys + 0.5) / H * 180.0)
V = np.stack([np.cos(DE) * np.cos(RA), np.sin(DE), -np.cos(DE) * np.sin(RA)], 1)
bands = {}; keep = []
for i in order:
    lim = np.cos(rad(0.3 if flux[i] < 0.5 else 0.8))
    bnd = int((np.degrees(DE[i]) + 90) // 1)
    clash = False
    for bb in (bnd - 1, bnd, bnd + 1):
        for j in bands.get(bb, ()):
            if V[i] @ V[j] > lim: clash = True; break
        if clash: break
    if clash: continue
    keep.append(i); bands.setdefault(bnd, []).append(i)
    if len(keep) >= N: break
order = np.array(keep)
ys, xs, flux, col = ys[order], xs[order], flux[order], col[order]
col = col / np.maximum(col.max(axis=1, keepdims=True), 1e-6)
ra = (0.5 - (xs + 0.5) / W) * 360.0
dec = 90.0 - (ys + 0.5) / H * 180.0
b = np.log10(flux / flux.min()) / np.log10(flux.max() / flux.min())   # 0 = faintest kept, 1 = brightest

rows = [[round(float(r), 2), round(float(d), 2), round(float(v), 3), round(float(c0), 2), round(float(c1), 2), round(float(c2), 2)]
        for r, d, v, (c0, c1, c2) in zip(ra, dec, b, col)]
json.dump({'source': 'Extracted from NASA/Goddard Scientific Visualization Studio, Deep Star Maps 2020 (Hipparcos-2, Tycho-2, Gaia DR2)',
           'fields': ['ra_deg', 'dec_deg', 'brightness', 'r', 'g', 'b'], 'stars': rows},
          open(out, 'w'), separators=(',', ':'))
print('candidates:', int(ismax.sum()), ' stars written:', len(rows))
