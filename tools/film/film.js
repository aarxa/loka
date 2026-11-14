// Film driver (tools/film): renders Loka one frame at a time through index.html?film, composites titles, and streams frames to the encoder.
const L = window.__loka;
export let W = 3840, H = 2160; export const FPS = 30;
const C = document.createElement('canvas'); const g = C.getContext('2d', { willReadFrequently: true });
export const S = 40;
const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10);
export const soft = x => .45 * x + .55 * ease(x);          // part linear, part eased: still moving through a crossfade
export const lerp = (a, b, t) => a + (b - a) * t;
export const cyl = (a, d, y) => [Math.sin(a) * d, y, Math.cos(a) * d];
export const expl = (a, b, t) => a * Math.pow(b / a, t);   // for pulling far back: even speed in perceived size

export function size(w, h, pr) { W = w; H = h; C.width = w; C.height = h; L.size(w, h, pr ?? 2.7 * h / 2160); }
export async function setup(w = 3840, h = 2160) {
  for (const el of document.body.children) if (el.id !== 'gl') el.style.visibility = 'hidden';
  document.body.style.overflow = 'hidden';
  await Promise.all(['500 100px "Cormorant Garamond"', 'italic 400 100px "Cormorant Garamond"', '400 100px "Cormorant Garamond"',
    'italic 400 40px Newsreader', '500 40px Inter', '400 40px Inter'].map(f => document.fonts.load(f)));
  await document.fonts.load('400 60px "Tiro Devanagari Sanskrit"', 'सत्यलोक');
  size(w, h); L.finish.uniforms.grain.value = .02; L.axisMat.opacity = .22;
}

// ---- shots: cam(u) for u in 0..1 over dur seconds; t0 sets the shot's animation clock ----
export const SHOTS = {
  egg: { dur: 9, t0: 40, cam: u => { const e = soft(u); return { pos: cyl(lerp(-.66, -.44, e), expl(1150, 780, e), lerp(-80, -15, e)), look: [0, -50, 0], fov: 44, fog: .0004, shift: .17 }; } },
  satya: { dur: 7.5, t0: 60, cam: u => { const e = soft(u); return { pos: cyl(lerp(.18, .46, e), lerp(42, 29, e), 6 * S + lerp(4.5, 8.5, e)), look: [0, 6 * S + 4, 0], fov: 44, fog: .008 }; } },
  tapa: { dur: 7.5, t0: 80, cam: u => { const e = soft(u); return { pos: cyl(lerp(.84, 1.1, e), lerp(39, 30, e), 5 * S + lerp(6, 3.5, e)), look: [0, 5 * S + .5, 0], fov: 46, fog: .008 }; } },
  jana: { dur: 7.5, t0: 100, cam: u => { const e = soft(u); return { pos: cyl(lerp(1.22, 1.52, e), lerp(52, 40, e), 4 * S + lerp(26, 17, e)), look: [0, 4 * S, 0], fov: 44, fog: .008 }; } },
  upper: { dur: 9, t0: 120, cam: u => { const e = soft(u), y = lerp(3 * S + 6, 1 * S + 2, e); return { pos: cyl(lerp(1.75, 2.55, e), lerp(54, 47, e), y + 21), look: [0, y - 1, 0], fov: 46, fog: .008 }; } },
  bhu: { dur: 9.5, t0: 140, cam: u => { const e = soft(u); return { pos: cyl(lerp(2.62, 3.02, e), lerp(128, 104, e), lerp(84, 62, e)), look: [0, 0, 0], fov: 44, fog: .0035, sunA: lerp(4.2, 4.2 + 2 * Math.PI * .85, sm(u)) }; } },
  bharata: { dur: 7, t0: 160, cam: u => { const e = soft(u); return { pos: cyl(lerp(Math.PI - .2, Math.PI + .12, e), lerp(48, 38, e), lerp(17, 11, e)), look: [0, 3, -4], fov: 44, fog: .005, sunA: 4.71 }; } },
  lower: { dur: 9.5, t0: 180, cam: u => { const e = soft(u), y = lerp(-1 * S, -7 * S, e); return { pos: cyl(lerp(3.6, 5.6, e), lerp(60, 54, e), y + 20), look: [0, y, 0], fov: 46, fog: .009 }; } },
  // the serpent, then one long pull back out through the egg's shell to the whole cosmos
  shesha: { dur: 19, t0: 200, cam: u => { const s = u * 19, B = -8.5 * S, b = sm((s - 6) / 9), eb = ease(b);
    return { pos: cyl(5.95 + .04 * s + .35 * eb, (84 - 10 * sm(s / 7)) * Math.pow(900 / 74, eb), lerp(B + 36 - 4 * sm(s / 7), -40, eb)),
      look: [0, lerp(B + 22, -50, ease(Math.min(1, b * 1.3))), 0], fov: 44, fog: lerp(.004, .0004, sm(b * 1.5)), shift: .17 * sm((s - 11) / 4) }; } },
};
export const ORDER = ['egg', 'satya', 'tapa', 'jana', 'upper', 'bhu', 'bharata', 'lower', 'shesha'];

// ---- titles ----
const INK = '#f1eadb', INK2 = '#d8cfbd', GOLD = '#e3b964', GOLD2 = '#bf9f62';
export const TITLES = {
  satya: { kicker: 'Upper world 7 of 7 · the highest', name: 'Satyaloka', deva: 'सत्यलोक', line: 'The world of Brahma, highest of all.' },
  tapa: { kicker: 'Upper world 6 of 7', name: 'Tapoloka', deva: 'तपोलोक', line: 'Home of the gods the fire that ends the world cannot burn.' },
  jana: { kicker: 'Upper world 5 of 7', name: 'Janaloka', deva: 'जनलोक', line: 'Home of the mind-born sons of Brahma.' },
  upper: { kicker: 'Upper worlds 4 to 2', name: 'Mahar · Svar · Bhuvar', deva: '', line: 'Above the pole star, the heaven of Indra, the open sky.' },
  bhu: { kicker: 'Upper world 1 of 7 · Earth', name: 'Bhurloka', deva: 'भूर्लोक', line: 'Mount Meru at the centre, ringed by seven continents and seven seas.' },
  bharata: { kicker: 'Jambudvipa · the southern land', name: 'Bharata', deva: 'भारतवर्ष', line: 'The land of action, where deeds bear fruit.' },
  lower: { kicker: 'Lower worlds 1 to 7', name: 'Atala to Patala', deva: 'पाताल', line: 'No sun below the earth. The jewels on the serpents’ hoods give the light.' },
  shesha: { kicker: 'Beneath all worlds', name: 'Ananta Shesha', deva: 'अनन्त शेष', line: 'The endless serpent who holds up the universe.', end: 7.2 },
};
function env(t, a, b, fin = .9, fout = .8) { return sm((t - a) / fin) * (1 - sm((t - (b - fout)) / fout)); }
function text(str, x, y, font, color, alpha, spacing = '0px', align = 'left') {
  g.font = font; g.letterSpacing = spacing; g.textAlign = align; g.fillStyle = color; g.globalAlpha = alpha; g.fillText(str, x, y);
}
function lower(T, a, t) {   // a lower third, bottom left, drifting up a little as it appears
  const k = H / 1080, x = 118 * k, base = H - 132 * k, rise = (1 - sm(a)) * 10 * k;
  g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 26 * k; g.textBaseline = 'alphabetic';
  g.globalAlpha = a * .85; g.fillStyle = GOLD; g.fillRect(x, base - 118 * k + rise, 44 * k, 1.5 * k);
  text(T.kicker.toUpperCase(), x, base - 90 * k + rise, `500 ${13.5 * k}px Inter`, GOLD, a * .95, `${.26 * 13.5 * k}px`);
  text(T.name, x - 3 * k, base - 30 * k + rise, `500 ${64 * k}px "Cormorant Garamond"`, INK, a);
  if (T.deva) { g.font = `500 ${64 * k}px "Cormorant Garamond"`; g.letterSpacing = '0px'; const w = g.measureText(T.name).width;
    text(T.deva, x + w + 22 * k, base - 34 * k + rise, `400 ${30 * k}px "Tiro Devanagari Sanskrit"`, GOLD2, a * .9); }
  text(T.line, x, base + 8 * k + rise, `italic 400 ${23 * k}px Newsreader`, INK2, a * .92);
  g.restore();
}
function title(a, sub, foot) {   // the wordmark, left of centre, with the cosmos to its right (as on the site)
  const k = H / 1080, x = W * .115, y = H / 2 + 20 * k, rise = (1 - sm(a)) * 12 * k;
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40 * k; g.textBaseline = 'alphabetic';
  g.globalAlpha = a * .85; g.fillStyle = GOLD; g.fillRect(x, y - 176 * k + rise, 52 * k, 1.5 * k);
  text('THE PURANIC COSMOS', x, y - 140 * k + rise, `500 ${14 * k}px Inter`, GOLD2, a * .95, `${.32 * 14 * k}px`);
  text('LOKA', x - 6 * k, y + rise, `500 ${150 * k}px "Cormorant Garamond"`, GOLD, a, `${.42 * 150 * k}px`);
  if (sub) text(sub, x, y + 76 * k + rise, `italic 400 ${38 * k}px "Cormorant Garamond"`, INK, a * .95);
  if (foot) text(foot, x, y + 142 * k + rise, `500 ${15 * k}px Inter`, INK2, a * .85, `${.28 * 15 * k}px`);
  g.restore();
}

// ---- the edit ----
export function timeline(order = ORDER, xf = 1.1) {
  let t = 0; const list = order.map(id => { const s = { id, ...SHOTS[id], start: t }; t += s.dur - xf; return s; });
  return { list, xf, total: t + xf };
}
function shotFrame(s, T, dt) {
  const u = Math.min(1, Math.max(0, (T - s.start) / s.dur));
  if (!s.state) { const c = s.cam(0); for (let i = 0; i < 45; i++) L.render(s.t0, 1 / 30, c); s.state = L.save(); }
  L.load(s.state); L.render(s.t0 + u * s.dur, dt, s.cam(u)); s.state = L.save();
}
export function draw(tl, T, dt = 1 / FPS, bare = false) {
  const on = tl.list.filter(s => T >= s.start && T < s.start + s.dur + 1e-6);
  g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  on.forEach((s, i) => { shotFrame(s, T, dt); g.globalAlpha = i === 0 ? 1 : sm((T - s.start) / tl.xf); g.drawImage(L.canvas, 0, 0, W, H); });
  if (bare) { g.globalAlpha = 1; return; }
  // titles
  const first = tl.list[0], last = tl.list[tl.list.length - 1];
  const tA = env(T, first.start + 1.6, first.start + first.dur - .2, 1.6, 1.2);
  if (tA > 0) title(tA, 'Fourteen worlds. One universe.');
  for (const s of tl.list) { const Ti = TITLES[s.id]; if (!Ti) continue; const a = env(T, s.start + 1.3, s.start + (Ti.end ?? s.dur - tl.xf - .1)); if (a > 0) lower(Ti, a, T); }
  const tE = env(T, last.start + last.dur - 5.2, tl.total + 5, 1.6, 1);
  if (tE > 0) title(tE, 'A journey through the fourteen worlds of the Puranas', 'AARXA.GITHUB.IO/LOKA');
  // fade up from black, down to black
  const fb = Math.max(1 - sm(T / 1.4), sm((T - (tl.total - 1.6)) / 1.6));
  if (fb > 0) { g.globalAlpha = fb; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  g.globalAlpha = 1;
}

// ---- output ----
const post = (u, b) => fetch(u, { method: 'POST', body: typeof b === 'string' || b instanceof Blob || ArrayBuffer.isView(b) ? b : JSON.stringify(b) }).then(r => r.json());
const blob = (type, q) => new Promise(r => C.toBlob(r, type, q));
export async function preview(id, us, tag = 'p', w = 1600, h = 900) {
  if (W !== w) size(w, h);
  const tl = { list: [{ id, ...SHOTS[id], start: 0 }], xf: 1, total: SHOTS[id].dur };
  for (const u of us) { draw(tl, u * SHOTS[id].dur * .999 + 1e-3, 1 / FPS, true); await post(`/save?name=_preview/${tag}-${id}-${u}.jpg`, await blob('image/jpeg', .9)); }
}
export async function previewFilm(times, tag = 'f', w = 1600, h = 900) {   // frames of the cut, titles and all
  if (W !== w) size(w, h); const tl = timeline();
  for (const t of times) { draw(tl, t); await post(`/save?name=_preview/${tag}-${t.toFixed(1)}.jpg`, await blob('image/jpeg', .9)); }
}
export async function still(id, u, name, w = 3840, h = 2160, cam) {
  if (W !== w || H !== h) size(w, h);
  const s = { id, ...SHOTS[id], start: 0 }; if (cam) s.cam = cam;
  const g0 = L.finish.uniforms.grain.value; L.finish.uniforms.grain.value = .012;
  shotFrame(s, u * s.dur, 1 / 30); g.globalAlpha = 1; g.drawImage(L.canvas, 0, 0, W, H);
  L.finish.uniforms.grain.value = g0;
  return post(`/save?name=${name}`, await blob('image/png'));
}
export const job = { f: 0, n: 0, done: false, log: '' };
export async function record(outs, { from = 0, to } = {}) {
  if (W !== 3840) size(3840, 2160);
  const tl = timeline(); const N = Math.round((to ?? tl.total) * FPS);
  job.n = N; job.done = false; job.t0 = performance.now();
  await post('/enc/begin', { w: W, h: H, fps: FPS, outs });
  // each frame goes as a near-lossless JPEG, encoded by a pool of workers (a page's own image encoding is throttled
  // when it is in the background), so the next frame renders while earlier ones encode and upload, in order
  const pool = [0, 1, 2].map(() => new Worker('/film/jpeg-worker.js')), wait = new Map(); let wi = 0;
  pool.forEach(w => w.onmessage = e => { wait.get(e.data.id)(e.data.blob); wait.delete(e.data.id); });
  const jpeg = id => { const px = g.getImageData(0, 0, W, H).data.buffer;
    return new Promise(r => { wait.set(id, r); pool[wi++ % pool.length].postMessage({ id, w: W, h: H, px, q: .97 }, [px]); }); };
  let chain = Promise.resolve(); const inflight = [];
  for (let f = Math.round(from * FPS); f < N; f++) { draw(tl, f / FPS); job.f = f;
    const bp = jpeg(f);
    chain = chain.then(async () => { const r = await post('/enc/frame', await bp); if (!r.ok) throw new Error(r.err); });
    inflight.push(chain); if (inflight.length > 4) await inflight.shift(); }
  await chain; pool.forEach(w => w.terminate());
  const r = await post('/enc/end', {}); job.log = r.log; job.done = true; job.sec = (performance.now() - job.t0) / 1000; return r;
}

// ---- stills: PNGs, encoded in a worker so a background page is not throttled ----
let sw = null;
function png() { sw ??= new Worker('/film/jpeg-worker.js'); const px = g.getImageData(0, 0, W, H).data.buffer;
  return new Promise(r => { sw.onmessage = e => r(e.data.blob); sw.postMessage({ id: 0, w: W, h: H, px, type: 'png' }, [px]); }); }
export async function shot(name, id, u, { w = 3840, h = 2160, cam } = {}) {     // one frame of a shot, no titles
  if (W !== w || H !== h) size(w, h);
  const s = { id, ...SHOTS[id], start: 0 }; if (cam) s.cam = cam;
  const g0 = L.finish.uniforms.grain.value; L.finish.uniforms.grain.value = .012;
  shotFrame(s, u * s.dur, 1 / 30); g.globalAlpha = 1; g.drawImage(L.canvas, 0, 0, W, H);
  L.finish.uniforms.grain.value = g0;
  return post(`/save?name=${name}`, await png());
}
export async function card(name, T) {                                           // a frame of the cut itself, titles and all
  if (W !== 3840) size(3840, 2160);
  const tl = timeline(); for (let k = 30; k >= 0; k--) draw(tl, T - k / FPS);   // run up to it, so fades have settled
  return post(`/save?name=${name}`, await png());
}
