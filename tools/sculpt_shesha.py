# Sculpt Ananta Shesha's crown in code: a hooded cobra head, and the body rising and splitting into seven necks.
# Shapes are signed distance fields (SDFs) blended with smooth unions, so the body, necks and hoods are one continuous
# surface. Each is meshed with surface nets; normals come from the SDF itself, so shading is smooth.
#
# Outputs (in <out dir>): shesha_unit.bin (one hood and head, reused for all seven), shesha_crown.bin (the body and the
# seven roots), shesha_sculpt.json (layout: the seven head transforms, eye and gem positions, mesh sizes).
# Units are the site's scene units; the crown frame has the site's "base" at y=0 and faces +z (rotate it to face the camera).
# Usage: python3 sculpt_shesha.py <out dir> [unit voxel, default 0.075] [crown voxel, default 0.12]
import sys, json, math
import numpy as np

out_dir = sys.argv[1]
VU = float(sys.argv[2]) if len(sys.argv) > 2 else 0.075
VC = float(sys.argv[3]) if len(sys.argv) > 3 else 0.12

# ---------------- SDF toolkit (numpy, vectorised) ----------------
def clamp(x, a, b): return np.minimum(np.maximum(x, a), b)
def smoothstep(a, b, x):
    t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3 - 2 * t)
def smin(a, b, k):
    h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return b * (1 - h) + a * h - k * h * (1 - h)
def smax(a, b, k): return -smin(-a, -b, k)
def ellipsoid(x, y, z, rx, ry, rz):
    k0 = np.sqrt((x / rx) ** 2 + (y / ry) ** 2 + (z / rz) ** 2)
    k1 = np.sqrt((x / rx ** 2) ** 2 + (y / ry ** 2) ** 2 + (z / rz ** 2) ** 2)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)
def sphere(x, y, z, c, r): return np.sqrt((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2) - r
def cone(x, y, z, a, b, ra, rb):
    # a capsule whose radius runs from ra at a to rb at b
    a = np.asarray(a, float); b = np.asarray(b, float); ba = b - a; L2 = float(ba @ ba)
    px, py, pz = x - a[0], y - a[1], z - a[2]
    h = clamp((px * ba[0] + py * ba[1] + pz * ba[2]) / L2, 0.0, 1.0)
    dx, dy, dz = px - ba[0] * h, py - ba[1] * h, pz - ba[2] * h
    return np.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h)
def rot_x(y, z, a): c, s = math.cos(a), math.sin(a); return c * y - s * z, s * y + c * z

# ---------------- one hood and head (unit frame: y up the neck, z forward, x across) ----------------
HEAD = np.array([0.0, 15.5, 2.3])    # centre of the skull, in front of the top of the hood
PITCH = 0.42                         # nose down, so the face and crown of the head turn toward the viewer
HSC = 1.25                           # head size relative to the hood
def head_local(x, y, z):
    # skull frame: the head pitched forward around its centre
    hx, hy, hz = x - HEAD[0], y - HEAD[1], z - HEAD[2]
    hy, hz = rot_x(hy, hz, PITCH)
    return hx, hy, hz
def head_sdf(x, y, z):
    hx, hy, hz = head_local(x, y, z)
    hx, hy, hz = hx / HSC, hy / HSC, hz / HSC
    taper = 1.0 - 0.3 * smoothstep(-0.6, 2.7, hz)                 # narrower toward the snout
    flat = 1.0 - 0.16 * smoothstep(0.0, 1.2, hy)                 # a flatter crown
    skull = ellipsoid(hx / taper, hy / flat, hz, 1.8, 1.15, 2.7)
    jaw = ellipsoid(hx / taper, hy + 0.58, hz + 0.05, 1.55, 0.62, 2.5)
    d = smin(skull, jaw, 0.35)
    brows = np.minimum(ellipsoid(hx - 0.82, hy - 0.78, hz - 0.7, 0.62, 0.28, 1.05), ellipsoid(hx + 0.82, hy - 0.78, hz - 0.7, 0.62, 0.28, 1.05))
    d = smin(d, brows, 0.25)                                       # the heavy brow over each eye
    for sx in (1, -1):
        d = smax(d, -sphere(hx, hy, hz, (sx * 1.2, 0.32, 1.05), 0.43), 0.1)        # eye sockets
        d = smax(d, -sphere(hx, hy, hz, (sx * 0.4, 0.24, 2.5), 0.11), 0.05)        # nostrils
    # the mouth: a thin cut along the sides and front, only near the surface so the head stays whole
    slit = ellipsoid(hx, hy + 0.22, hz + 0.05, 2.0, 0.045, 2.45)     # stops short of the snout tip, so it never cuts through
    groove = np.maximum(slit, -(d + 0.11))
    d = smax(d, -groove, 0.03)
    return d * HSC
def unit_sdf(x, y, z):
    # neck: narrow at its very foot (so the roots below can swallow it), full in the middle, narrowing toward the head
    # and above that it runs behind the hood's face, so from the front you see the smooth shield of the hood
    neck = np.minimum(np.minimum(cone(x, y, z, (0, -3.2, -0.15), (0, 1.0, -0.05), 1.55, 1.95), cone(x, y, z, (0, 1.0, -0.05), (0, 5.0, -1.0), 1.95, 1.25)),
                      cone(x, y, z, (0, 5.0, -1.0), (0, 14.4, -0.9), 1.25, 1.05))   # behind the hood's face: a ridge down its back
    # hood: a broad, thin, teardrop shield, swept back at the edges and widest above the middle
    hy = y - 7.6
    width = 5.3 * (0.8 + 0.2 * smoothstep(-7.5, 2.0, hy))        # the hood runs down the neck, narrowing a little
    thick = np.maximum(0.95 * (1 - 0.62 * (x / 5.3) ** 2), 0.3)
    hz = z + 0.055 * x * x + 0.25
    hood = ellipsoid(x / width * 5.3, hy, hz / thick, 5.3, 8.0, 1.0) * np.minimum(thick, 1.0)
    d = smin(neck, hood, 1.1)
    d = smin(d, head_sdf(x, y, z), 0.7)
    return d

# ---------------- the seven heads' places (crown frame; must match the page) ----------------
HS, TOP = 1.3, 11.0
def euler_yxz(yaw, rx, rz):
    cy, sy, cx, sx, cz, sz = math.cos(yaw), math.sin(yaw), math.cos(rx), math.sin(rx), math.cos(rz), math.sin(rz)
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]); Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]); Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Ry @ Rx @ Rz
UNITS = []
for k in range(-3, 4):
    ak = abs(k)
    s = 1.18 * (1 - ak * 0.06)
    pos = np.array([k * 1.25 * HS, TOP - (2.6 + ak * 0.85) * HS, (0.6 - ak * 1.7) * HS])   # each pair further out sits further back
    R = euler_yxz(k * 0.09, ak * 0.05, -k * 0.33)
    UNITS.append(dict(k=k, s=s, pos=pos, R=R))
def to_crown(u, p): return u['pos'] + u['s'] * (u['R'] @ np.asarray(p, float))

def crown_sdf(x, y, z):
    d = cone(x, y, z, (0, -5.0, 0), (0, 3.2, 0.4), 4.3, 3.5)                         # the body rising at the axis
    roots = None
    for u in UNITS:
        a = np.array([u['k'] * 0.55, 2.4, 0.55 - 0.35 * abs(u['k'])])
        b = to_crown(u, (0, 0.9, -0.05))
        r = cone(x, y, z, a, b, 2.05 * u['s'], 1.83 * u['s'])
        roots = r if roots is None else smin(roots, r, 0.9)
    return smin(d, roots, 1.9)

# ---------------- surface nets ----------------
CORNERS = np.array([(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1), (0, 1, 1), (1, 1, 1)])
EDGES = [(0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)]
def mesh(sdf, lo, hi, h):
    nx, ny, nz = [int(math.ceil((hi[i] - lo[i]) / h)) + 1 for i in range(3)]
    xs, ys, zs = [lo[i] + h * np.arange(n) for i, n in enumerate((nx, ny, nz))]
    f = np.empty((nx, ny, nz), np.float32)
    Y, Z = np.meshgrid(ys, zs, indexing='ij')
    for i in range(nx):                                                       # one x-slab at a time keeps memory low
        f[i] = sdf(np.full_like(Y, xs[i]), Y, Z)
    inside = f < 0
    # cells that straddle the surface get one vertex: the average of their edge crossings
    cv = [f[c[0]:nx - 1 + c[0], c[1]:ny - 1 + c[1], c[2]:nz - 1 + c[2]] for c in CORNERS]
    mn = np.minimum.reduce(cv); mx = np.maximum.reduce(cv)
    act = (mn < 0) & (mx >= 0)
    ci = np.argwhere(act); M = len(ci)
    vals = np.stack([v[act] for v in cv], 1)
    acc = np.zeros((M, 3)); cnt = np.zeros(M)
    for e0, e1 in EDGES:
        v0, v1 = vals[:, e0], vals[:, e1]; m = (v0 < 0) != (v1 < 0)
        t = v0[m] / (v0[m] - v1[m])
        acc[m] += CORNERS[e0] + t[:, None] * (CORNERS[e1] - CORNERS[e0]); cnt[m] += 1
    verts = np.array(lo) + h * (ci + acc / cnt[:, None])
    vid = -np.ones(act.shape, np.int64); vid[act] = np.arange(M)
    # every grid edge that crosses the surface becomes a quad joining the four cells around it
    quads = []
    for axis in range(3):
        o = [0, 0, 0]; o[axis] = 1
        a = inside[tuple(slice(0, n - 1) if d == axis else slice(1, n - 1) for d, n in enumerate((nx, ny, nz)))]
        b = inside[tuple(slice(1, n) if d == axis else slice(1, n - 1) for d, n in enumerate((nx, ny, nz)))]
        idx = np.argwhere(a != b); flip = a[a != b]
        u, v = [d for d in range(3) if d != axis]
        def cell(du, dv):
            c = idx.copy(); c[:, u] += du; c[:, v] += dv
            return vid[c[:, 0], c[:, 1], c[:, 2]]
        q = np.stack([cell(0, 0), cell(1, 0), cell(1, 1), cell(0, 1)], 1)
        q[flip] = q[flip][:, ::-1]
        quads.append(q)
    q = np.concatenate(quads); q = q[(q >= 0).all(1)]
    tris = np.concatenate([q[:, [0, 1, 2]], q[:, [0, 2, 3]]])
    # normals straight from the field, and faces turned to agree with them
    e = h * 0.5
    def grad(p):
        x, y, z = p[:, 0], p[:, 1], p[:, 2]
        g = np.stack([sdf(x + e, y, z) - sdf(x - e, y, z), sdf(x, y + e, z) - sdf(x, y - e, z), sdf(x, y, z + e) - sdf(x, y, z - e)], 1)
        return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
    nrm = grad(verts)
    fn = np.cross(verts[tris[:, 1]] - verts[tris[:, 0]], verts[tris[:, 2]] - verts[tris[:, 0]])
    wrong = (fn * (nrm[tris[:, 0]] + nrm[tris[:, 1]] + nrm[tris[:, 2]])).sum(1) < 0
    tris[wrong] = tris[wrong][:, ::-1]
    return verts.astype(np.float32), nrm.astype(np.float32), tris.astype(np.uint32), (nx, ny, nz)

def write_bin(path, v, n, t):
    # little-endian: uint32 vertex count, uint32 index count, float32 xyz per vertex, int8 xyz normal (+1 pad), uint32 indices
    nn = np.clip(np.round(n * 127), -127, 127).astype(np.int8)
    nn = np.concatenate([nn, np.zeros((len(nn), 1), np.int8)], 1)
    with open(path, 'wb') as fh:
        fh.write(np.array([len(v), t.size], np.uint32).tobytes()); fh.write(v.tobytes()); fh.write(nn.tobytes()); fh.write(t.reshape(-1).tobytes())

def surface_point(sdf, start, direction, step=0.02, maxd=6.0):
    p = np.array(start, float); d = np.array(direction, float) / np.linalg.norm(direction)
    prev = sdf(*[np.array([c]) for c in p])[0]
    for _ in range(int(maxd / step)):
        q = p + d * step; v = sdf(*[np.array([c]) for c in q])[0]
        if prev < 0 <= v: return q.tolist()
        p, prev = q, v
    return p.tolist()

uv, un, ut, ug = mesh(unit_sdf, (-7.6, -3.6, -3.6), (7.6, 19.6, 7.8), VU)
print('unit  grid %s  verts %d  tris %d' % (ug, len(uv), len(ut)))
cl = np.min([to_crown(u, (0, -3.6, 0)) for u in UNITS], 0) - 4.0; ch = np.max([to_crown(u, (0, 1.5, 0)) for u in UNITS], 0) + 3.5
lo = (min(cl[0], -6.0), -5.5, min(cl[2], -5.5)); hi = (max(ch[0], 6.0), max(ch[1], 4.5), max(ch[2], 5.5))
cv_, cn_, ct_, cg_ = mesh(crown_sdf, lo, hi, VC)
print('crown grid %s  verts %d  tris %d' % (cg_, len(cv_), len(ct_)))
write_bin(out_dir + '/shesha_unit.bin', uv, un, ut)
write_bin(out_dir + '/shesha_crown.bin', cv_, cn_, ct_)

# eyes sit in their sockets; the gem sits on the throat, in front of the hood
eyes = []
for sx in (1, -1):
    c = np.array([sx * 1.14, 0.32, 1.05]) * HSC    # skull frame
    cy, cz = rot_x(np.array([c[1]]), np.array([c[2]]), -PITCH)
    eyes.append([float(c[0] + HEAD[0]), float(cy[0] + HEAD[1]), float(cz[0] + HEAD[2])])
gem = surface_point(unit_sdf, (0, 8.6, 0.0), (0, 0, 1))
meta = dict(credit='Sculpted in code for Loka (tools/sculpt_shesha.py)', units=[dict(k=u['k'], s=u['s'], pos=u['pos'].round(4).tolist(), R=u['R'].round(6).tolist()) for u in UNITS],
            eyes=eyes, eyeR=0.37 * HSC, gem=gem, headPitch=PITCH, head=HEAD.tolist(),
            unit=dict(verts=int(len(uv)), tris=int(len(ut))), crown=dict(verts=int(len(cv_)), tris=int(len(ct_))))
json.dump(meta, open(out_dir + '/shesha_sculpt.json', 'w'), indent=1)
print('eyes', [[round(c, 2) for c in e] for e in eyes], 'gem', [round(c, 2) for c in gem])
