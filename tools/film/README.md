# Film kit

Renders the portfolio film, stills and website screenshots straight from the site, one frame at a time, so the
results are smooth and full quality however heavy the scene is. Runs on a Mac with no extra installs: Swift, Node,
the Mac's own video encoder, and Chrome.

## How it works

- **`index.html?film`** turns on film mode in `js/cosmos.js`. The page stops animating by itself and exposes
  `window.__loka`, which renders one frame at a given size, time and camera.
- **`film.js`** holds the edit. It has the shots (a camera move per world), the titles in the site's own type,
  and the crossfades. For each frame it renders the shot or shots, draws the titles over them, and hands the
  frame to a pool of workers that encode it as a near-lossless JPEG.
- **`server.mjs`** serves the site and streams the frames into **`enc`**. `enc` writes several videos at once
  (for example 4K and 1080p) with the Mac's hardware H.264 encoder.
- **`drone.py`** synthesizes the tanpura-style soundtrack. **`mux`** adds it to a video without re-encoding.
- **`cdp-shot.mjs`** takes real screenshots of the site, desktop or phone, through headless Chrome.

## Use

Build the Swift tools:

```bash
cd tools/film && swiftc -O enc.swift -o enc && swiftc -O mux.swift -o mux && swiftc -O grab.swift -o grab
```

Start the server, giving it the site folder and the output folder:

```bash
node tools/film/server.mjs . portfolio
```

Open http://127.0.0.1:5176/index.html?film and keep that page visible while it renders. In its console, record
the film to 4K and 1080p at once:

```js
F = await import('/film/film.js'); await F.setup();
await F.record([['video/loka-film-4k.mp4', 3840, 2160, 'h264', 80e6], ['video/loka-film-1080p.mp4', 1920, 1080, 'h264', 12e6]]);
```

Other calls:

- `F.shot(name, shotId, u)` saves one frame of a shot as a PNG; `u` runs from 0 to 1 across the shot.
- `F.card(name, seconds)` saves a frame of the film itself, titles included.
- `F.preview(shotId, [0, .5, 1])` saves small JPEGs for checking framing.

Add the soundtrack:

```bash
python3 tools/film/drone.py drone.wav 76.7 62 71
```

```bash
afconvert -f m4af -d aac -b 256000 drone.wav drone.m4a
```

```bash
tools/film/mux portfolio/video/no-music/loka-film-4k.mp4 drone.m4a portfolio/video/loka-film-4k.mp4
```

Take website screenshots. The arguments are the output folder, width, height, pixel ratio and whether it's a phone:

```bash
node tools/film/cdp-shot.mjs portfolio/website/desktop 1440 900 2 0 "satya=http://127.0.0.1:5173/index.html#s-satya"
```

`sheet.py` tiles images into a contact sheet for reviewing them.
