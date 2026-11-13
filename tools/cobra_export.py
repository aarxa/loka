# Cut the raised neck, hood and head out of "King Cobra" by Anthony Yanez (CC BY 4.0), re-centre it on the base of the
# neck, scale it to scene units and write it as compact base64 arrays. Also retint the python-skin textures to Shesha's pale white.
import sys, json, base64, numpy as np
from PIL import Image
src, out_dir, tex_dir = sys.argv[1], sys.argv[2], sys.argv[3]
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
    return acc(a['POSITION']), acc(a['NORMAL']), acc(a['TEXCOORD_0']), acc(p['indices']).reshape(-1, 3).astype(np.int64)

CUT = 3.0       # raw units; the ground coil lies below this, the neck rises above it
SCALE = 0.1     # raw -> scene units
parts = [('front', 1, 'A'), ('back', 2, 'B'), ('head', 0, 'B'), ('eyes', 3, None), ('mouth', 4, None)]
# centre: the base of the neck, just above the cut
base_pts = np.concatenate([mesh(mi)[0] for _, mi, _ in parts[:2]])
sel = base_pts[(base_pts[:, 1] > CUT) & (base_pts[:, 1] < CUT + 10)]
C = np.array([sel[:, 0].mean(), CUT, sel[:, 2].mean()], np.float32)
print('neck base centre (raw):', C.round(1), ' radius ~', round(float(np.hypot(sel[:, 0] - C[0], sel[:, 2] - C[2]).max()), 1))

def b64(a): return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
out = {'credit': '"King Cobra" by Anthony Yanez, https://sketchfab.com/3d-models/king-cobra-a8dab84cd4fc428bbcfe194e3ac14d06, CC BY 4.0. Cut to the neck, hood and head, and retinted.',
       'meshes': []}
for name, mi, texk in parts:
    P, N, UV, I = mesh(mi)
    keep = (P[I][:, :, 1] > CUT).all(axis=1)
    I = I[keep]; used = np.unique(I); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
    P = (P[used] - C) * SCALE; N = N[used]; UV = UV[used]; I = remap[I].astype(np.uint16)
    out['meshes'].append({'name': name, 'tex': texk, 'count': int(len(P)), 'pos': b64(P.astype(np.float32)), 'nor': b64(N.astype(np.float32)),
                          'uv': b64(UV.astype(np.float32)), 'idx': b64(I.reshape(-1))})
    print('%-6s verts %5d  tris %5d  bbox %s .. %s' % (name, len(P), len(I), P.min(0).round(2), P.max(0).round(2)))

# anchors: the middle of the hood's front face (for the jewel), and the tip of the snout
Pf = (mesh(1)[0] - C) * SCALE
band = Pf[(Pf[:, 1] > 12.0) & (Pf[:, 1] < 15.0)]
cx = float(np.median(band[:, 0])); mid = band[np.abs(band[:, 0] - cx) < 1.5]
out['hoodFront'] = [round(cx, 3), 13.5, round(float(mid[:, 2].max()) + 0.15, 3)]
Ph = (mesh(0)[0] - C) * SCALE
out['snout'] = [round(float(v), 3) for v in Ph[Ph[:, 2].argmax()]]
out['headTop'] = [round(float(np.median(Ph[:, 0])), 3), round(float(Ph[:, 1].max()), 3), round(float(np.median(Ph[:, 2])), 3)]
print('hoodFront', out['hoodFront'], 'snout', out['snout'], 'headTop', out['headTop'])

js = json.dumps(out, separators=(',', ':'))
open(out_dir + '/shesha_hood.json', 'w').write(js)
open(out_dir + '/shesha_hood.js', 'w').write('/* ' + out['credit'] + ' */\nwindow.LOKA_COBRA=' + js + ';\n')
print('json bytes', len(js))

# textures: python skin -> pale moon-white with a slate-blue pattern; normals kept as they are
def retint(path, dst, lo, hi):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255.0
    L = im @ np.array([0.299, 0.587, 0.114], np.float32)
    L = (L - np.percentile(L, 2)) / max(np.percentile(L, 98) - np.percentile(L, 2), 1e-3)
    L = np.clip(L, 0, 1); L = L * L * (3 - 2 * L)
    t = 0.52 + 0.48 * L
    rgb = np.array(lo, np.float32) * (1 - t[..., None]) + np.array(hi, np.float32) * t[..., None]
    Image.fromarray((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst, quality=90)
T = src + '/textures/'
retint(T + '13_-_Default_baseColor.jpeg', tex_dir + '/naga_skin_a.jpg', (0.50, 0.56, 0.70), (0.97, 0.96, 0.93))
retint(T + '08_-_Default_baseColor.jpeg', tex_dir + '/naga_skin_b.jpg', (0.44, 0.50, 0.64), (0.94, 0.94, 0.93))
for s, d in (('13', 'naga_nor_a'), ('08', 'naga_nor_b')):
    Image.open(T + s + '_-_Default_normal.png').convert('RGB').save(tex_dir + '/' + d + '.jpg', quality=92)
print('textures written')
