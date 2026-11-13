# Paint the drawn stars out of the NASA star map. The page draws the brightest stars itself as crisp points
# (stars.bin), so their copies in the sky image would only show up as soft squares around them. The faint stars stay
# in the image: they are what gives the Milky Way its grain.
# Usage: python3 sky_background.py <starmap-4k.jpg> <stars.json> <out-4k.jpg> <out-2k.jpg>
import sys, json, math
import numpy as np
from PIL import Image

src, stars_json, out4, out2 = sys.argv[1:5]
img = Image.open(src).convert('RGB')
W, H = img.size
rgb = np.asarray(img).astype(np.float32)
stars = json.load(open(stars_json))['stars']

def box(a, r, axis):
    # box blur of radius r along one axis: wraps around in RA (x), clamps at the poles (y)
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    p = np.pad(a, pad, mode='wrap' if axis == 1 else 'edge')
    c = np.cumsum(p, axis=axis, dtype=np.float64)
    hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
    lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
    return ((hi - lo) / (2 * r + 1)).astype(np.float32)

def blur(a, r):
    for _ in range(3):
        a = box(box(a, r, 1), r, 0)
    return a

# a soft disc over each drawn star, bigger for brighter stars, and stretched in RA towards the poles,
# where the map's pixels get narrower on the sky
mask = np.zeros((H, W), np.float32)
for ra, dec, b, *_ in stars:
    x = (0.5 - ra / 360.0) * W - 0.5
    y = (90.0 - dec) / 180.0 * H - 0.5
    r = 1.6 + 4.2 * b * b
    rx = min(r / max(math.cos(math.radians(dec)), 0.06), 60.0)
    x0, x1 = int(math.floor(x - rx - 1)), int(math.ceil(x + rx + 1))
    y0, y1 = max(0, int(math.floor(y - r - 1))), min(H - 1, int(math.ceil(y + r + 1)))
    ys = np.arange(y0, y1 + 1)[:, None]
    xs = np.arange(x0, x1 + 1)[None, :]
    d = np.sqrt(((xs - x) / rx) ** 2 + ((ys - y) / r) ** 2)
    m = np.clip(1.5 - d, 0, 1)                      # 1 inside the disc, fading out over its rim
    cols = np.mod(np.arange(x0, x1 + 1), W)
    np.maximum.at(mask, (np.repeat(ys, len(cols), 1), np.tile(cols, (len(ys), 1))), m)

# fill the discs from the sky around them (normalized convolution: average only pixels outside the discs)
keep = 1.0 - mask
den = blur(keep, 3) + 1e-4
fill = np.stack([blur(rgb[..., k] * keep, 3) / den for k in range(3)], -1)
bg = rgb * (1 - mask[..., None]) + fill * mask[..., None]
out = Image.fromarray(np.clip(bg + 0.5, 0, 255).astype(np.uint8))
out.save(out4, quality=90, optimize=True)
out.resize((W // 2, H // 2), Image.LANCZOS).save(out2, quality=90, optimize=True)
print('%d stars painted out, %.2f%% of pixels touched ->' % (len(stars), 100 * (mask > 0).mean()), out4, out2)
