// Screenshots of the live site through headless Chrome's DevTools protocol.
// node cdp-shot.mjs <outdir> <w> <h> <dpr> <mobile 0|1> name=url-or-hash ...
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const [out, w, h, dpr, mob, ...shots] = process.argv.slice(2);
const prof = path.join(path.dirname(new URL(import.meta.url).pathname), 'chrome-cdp');
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${prof}`, '--no-first-run',
  '--remote-debugging-port=9333', '--hide-scrollbars', `--window-size=${w},${h}`, '--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver; for (let i = 0; i < 50 && !ver; i++) { await sleep(200); try { ver = await (await fetch('http://127.0.0.1:9333/json/list')).json(); } catch {} }
const page = ver.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const wait = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: +dpr, mobile: mob === '1' });
if (mob === '1') await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
fs.mkdirSync(out, { recursive: true });
for (const s of shots) {
  const [name, url] = s.split('=');
  await send('Page.navigate', { url }); await sleep(7000);   // load, then let the camera glide to its stop and settle
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('wrote', name);
}
ws.close(); chrome.kill();
