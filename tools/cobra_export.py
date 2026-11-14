# Cut the raised neck, hood and head out of "King Cobra" by Anthony Yanez (CC BY 4.0), re-centre it on the base of the
# neck, scale it to scene units, smooth it, and write it as compact base64 arrays. Also retint the python-skin textures to
# Shesha's pale ivory.
import sys, json, base64, numpy as np
from PIL import Image
src, out_dir, tex_dir = sys.argv[1], sys.argv[2], sys.argv[3]
LEVELS = int(sys.argv[4]) if len(sys.argv) > 4 else 1     # rounds of smoothing for the hood and head (each one quadruples the triangles)
g = json.load(open(src + '/scene.gltf')); buf = open(src + '/scene.bin', 'rb').read()
CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}; NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
def acc(i):
    a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); n = NC[a['type']]; dt = CT[a['componentType']]
    stride = bv.get('byteStride', 0); isz = np.dtype(dt).itemsize * n
    if stride and stride != isz:
        raw = np.frombuffer(buf, np.uint8, count=stride * a['count'], offset=off).reshape(a['count'], stride)[:, :isz]
        return np.frombuffer(raw.tobytes(), dt).reshape(a['count'], n).copy()
    return np.frombuffer(buf, dt, count=a['count'] * n, offset=off).reshape(a['count'], n).copy()
def mesh(mi):
    p = g['meshes'][mi]['primitives'][0]; a = p['attributes']
    return acc(a['POSITION']), acc(p['indices']).reshape(-1, 3).astype(np.int64)

CUT = 3.0       # raw units; the ground coil lies below this, the neck rises above it
SCALE = 0.1     # raw -> scene units
PARTS = {'head': 0, 'front': 1, 'back': 2, 'eyes': 3, 'mouth': 4}
# centre: the base of the neck, just above the cut
base_pts = np.concatenate([mesh(PARTS[n])[0] for n in ('front', 'back')])
sel = base_pts[(base_pts[:, 1] > CUT) & (base_pts[:, 1] < CUT + 10)]
C = np.array([sel[:, 0].mean(), CUT, sel[:, 2].mean()], np.float32)

def cut(name):
    P, I = mesh(PARTS[name])
    I = I[(P[I][:, :, 1] > CUT).all(axis=1)]
    return (P.astype(np.float64) - C) * SCALE, I

def weld(P, I, tol=1e-4):
    # the model splits its vertices along texture seams; join them so smoothing sees one surface
    key = np.round(P / tol).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.reshape(-1); I = inv[I]
    ok = (I[:, 0] != I[:, 1]) & (I[:, 1] != I[:, 2]) & (I[:, 0] != I[:, 2])   # drop triangles that collapse
    return P[first], I[ok], ok

def loop(P, I):
    # one round of Loop subdivision: every triangle becomes four, and every point moves toward the smooth surface.
    # Edges with one face (the cut at the base) or more than two are kept as creases.
    nv = len(P); E = np.sort(np.concatenate([I[:, [0, 1]], I[:, [1, 2]], I[:, [2, 0]]]), axis=1)
    opp = np.concatenate([I[:, 2], I[:, 0], I[:, 1]])
    ek, einv, ecount = np.unique(E, axis=0, return_inverse=True, return_counts=True); einv = einv.reshape(-1)
    inner = ecount[einv] == 2
    # new edge points
    osum = np.zeros((len(ek), 3)); np.add.at(osum, einv[inner], P[opp[inner]])
    EP = (P[ek[:, 0]] + P[ek[:, 1]]) * 0.5
    two = ecount == 2; EP[two] = 0.375 * (P[ek[two, 0]] + P[ek[two, 1]]) + 0.125 * osum[two]
    # moved old points
    crease = ecount != 2
    nb = [set() for _ in range(nv)]; cn = [set() for _ in range(nv)]
    for (a, b), c in zip(ek, crease):
        nb[a].add(b); nb[b].add(a)
        if c: cn[a].add(b); cn[b].add(a)
    VP = P.copy()
    for v in range(nv):
        if cn[v]:
            if len(cn[v]) == 2:
                a, b = tuple(cn[v]); VP[v] = 0.75 * P[v] + 0.125 * (P[a] + P[b])
        elif nb[v]:
            n = len(nb[v]); beta = (0.625 - (0.375 + 0.25 * np.cos(2 * np.pi / n)) ** 2) / n
            VP[v] = (1 - n * beta) * P[v] + beta * P[list(nb[v])].sum(0)
    NP = np.concatenate([VP, EP]); m = nv + einv.reshape(3, -1).T   # edge points of (v0v1, v1v2, v2v0)
    a, b, c = I[:, 0], I[:, 1], I[:, 2]; ab, bc, ca = m[:, 0], m[:, 1], m[:, 2]
    NI = np.stack([np.stack([a, ab, ca], 1), np.stack([ab, b, bc], 1), np.stack([ca, bc, c], 1), np.stack([ab, bc, ca], 1)], 1).reshape(-1, 3)
    return NP, NI      # children of face i are 4i .. 4i+3

def normals(P, I):
    N = np.zeros_like(P); fn = np.cross(P[I[:, 1]] - P[I[:, 0]], P[I[:, 2]] - P[I[:, 0]])
    for k in range(3): np.add.at(N, I[:, k], fn)
    return N / np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)

def smooth(names, levels):
    # weld the parts into one surface (so the hood's front and back meet in a smooth rim), subdivide, then split them again
    Ps, Is, tag, off = [], [], [], 0
    for k, n in enumerate(names):
        P, I = cut(n); Ps.append(P); Is.append(I + off); tag.append(np.full(len(I), k)); off += len(P)
    P, I, ok = weld(np.concatenate(Ps), np.concatenate(Is)); tag = np.concatenate(tag)[ok]
    for _ in range(levels):
        P, I = loop(P, I); tag = np.repeat(tag, 4)
    N = normals(P, I); out = {}
    for k, n in enumerate(names):
        J = I[tag == k]; used = np.unique(J); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
        out[n] = (P[used], N[used], remap[J])
    return out

parts = {}
parts.update(smooth(['front', 'back'], LEVELS))
parts.update(smooth(['head'], LEVELS))
parts.update(smooth(['eyes'], 1))
P, I = cut('mouth'); parts['mouth'] = (P, normals(P, I), I)        # a thin strip along the jaw: left as it is

def b64(a): return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
out = {'credit': '"King Cobra" by Anthony Yanez, https://sketchfab.com/3d-models/king-cobra-a8dab84cd4fc428bbcfe194e3ac14d06, CC BY 4.0. '
                 'Cut to the neck, hood and head, and smoothed.', 'meshes': []}
for name in ('front', 'back', 'head', 'eyes', 'mouth'):
    P, N, I = parts[name]
    assert len(P) < 65536
    out['meshes'].append({'name': name, 'count': int(len(P)), 'pos': b64(P.astype(np.float32)), 'nor': b64(N.astype(np.float32)),
                          'idx': b64(I.astype(np.uint16).reshape(-1))})
    print('%-6s verts %5d  tris %5d  bbox %s .. %s' % (name, len(P), len(I), P.min(0).round(2), P.max(0).round(2)))

# anchors: the middle of the hood's front face (for the jewel), the tip of the snout, the top of the head
Pf = parts['front'][0]
band = Pf[(Pf[:, 1] > 12.0) & (Pf[:, 1] < 15.0)]
cx = float(np.median(band[:, 0])); mid = band[np.abs(band[:, 0] - cx) < 1.5]
out['hoodFront'] = [round(cx, 3), 13.5, round(float(mid[:, 2].max()) + 0.15, 3)]
Ph = parts['head'][0]
out['snout'] = [round(float(v), 3) for v in Ph[Ph[:, 2].argmax()]]
out['headTop'] = [round(float(np.median(Ph[:, 0])), 3), round(float(Ph[:, 1].max()), 3), round(float(np.median(Ph[:, 2])), 3)]

# the neck leans, so measure its real cross-section (centre and half-widths) where the roots join it
def section(y):
    pts = []
    for n in ('front', 'back'):
        P, _, I = parts[n]
        for a, b in ((0, 1), (1, 2), (2, 0)):
            pa, pb = P[I[:, a]], P[I[:, b]]; s = (pa[:, 1] - y) * (pb[:, 1] - y) < 0
            f = ((y - pa[s, 1]) / (pb[s, 1] - pa[s, 1]))[:, None]; pts.append(pa[s] + (pb[s] - pa[s]) * f)
    S = np.concatenate(pts); lo, hi = S.min(0), S.max(0)
    return [round(float(v), 3) for v in (lo + hi) / 2], [round(float(v), 3) for v in (hi - lo) / 2]
c0, h0 = section(3.3); c1, _ = section(4.6)
out['neck'] = {'join': c0, 'up': c1, 'half': [h0[0], h0[2]]}
print('hoodFront', out['hoodFront'], 'snout', out['snout'], 'headTop', out['headTop'], 'neck', out['neck'])

js = json.dumps(out, separators=(',', ':'))
open(out_dir + '/shesha_hood.json', 'w').write(js)
print('json bytes', len(js))

# textures: python skin -> warm ivory with soft taupe markings, like a pale cobra; normals kept as they are
def retint(path, dst, lo, hi):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255.0
    L = im @ np.array([0.299, 0.587, 0.114], np.float32)
    L = (L - np.percentile(L, 2)) / max(np.percentile(L, 98) - np.percentile(L, 2), 1e-3)
    L = np.clip(L, 0, 1); L = L * L * (3 - 2 * L)
    t = 0.52 + 0.48 * L
    rgb = np.array(lo, np.float32) * (1 - t[..., None]) + np.array(hi, np.float32) * t[..., None]
    Image.fromarray((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst, quality=90)
T = src + '/textures/'
retint(T + '13_-_Default_baseColor.jpeg', tex_dir + '/naga_skin_a.jpg', (0.60, 0.54, 0.45), (0.98, 0.95, 0.89))
retint(T + '08_-_Default_baseColor.jpeg', tex_dir + '/naga_skin_b.jpg', (0.50, 0.45, 0.38), (0.95, 0.92, 0.86))
for s_, d in (('13', 'naga_nor_a'), ('08', 'naga_nor_b')):
    Image.open(T + s_ + '_-_Default_normal.png').convert('RGB').save(tex_dir + '/' + d + '.jpg', quality=92)
print('textures written')
