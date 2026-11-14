// Serves the site (and /film/ from this folder) and takes rendered frames, streaming them straight into the encoder.
// POST /enc/begin {w,h,fps,outs}  /enc/frame <raw RGBA>  /enc/end  /save?name=...
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const [ROOT, OUT] = process.argv.slice(2); const FILM = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4' };
let enc = null, log = '';
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  const json = o => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (req.method === 'POST') {
    if (p === '/enc/frame') {
      if (!enc) { req.resume(); req.on('end', () => json({ ok: false, err: 'no encoder' })); return; }
      const hd = Buffer.alloc(4); hd.writeUInt32LE(+req.headers['content-length']); enc.stdin.write(hd);
      req.on('data', c => { if (!enc.stdin.write(c)) { req.pause(); enc.stdin.once('drain', () => req.resume()); } });
      req.on('end', () => json({ ok: true })); return;
    }
    const chunks = []; req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (p === '/enc/begin') {
        const c = JSON.parse(body);
        const outs = c.outs.map(o => { const f = path.join(OUT, o[0]); fs.mkdirSync(path.dirname(f), { recursive: true }); return [f, ...o.slice(1)].join(','); });
        log = ''; enc = spawn(path.join(FILM, 'enc'), [c.w, c.h, c.fps, ...outs].map(String));
        enc.stdout.on('data', d => log += d); enc.stderr.on('data', d => log += d); enc.on('error', e => log += String(e));
        return json({ ok: true });
      }
      if (p === '/enc/end') { const e = enc; e.on('close', () => json({ ok: true, log })); e.stdin.end(); enc = null; return; }
      if (p === '/save') {
        const f = path.join(OUT, u.searchParams.get('name')); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body);
        return json({ ok: true, bytes: body.length });
      }
      res.writeHead(404); res.end();
    });
    return;
  }
  let f = p.startsWith('/film/') ? path.join(FILM, p.slice(6)) : path.join(ROOT, decodeURIComponent(p));
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d);
  });
});
// never close an idle connection: the browser does not retry a POST that lands on one the server just closed
server.keepAliveTimeout = 0; server.requestTimeout = 0; server.headersTimeout = 0;
server.listen(5176, '127.0.0.1', () => console.log('ready 5176'));
