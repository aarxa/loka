# Asset tools

Python 3 scripts that turn the original downloads into the files in `assets/`. They need `numpy` and `Pillow`.

- **`extract_stars.py <starmap.png> <stars.json> [count]`** finds the brightest point stars in the NASA star map and writes their RA, Dec, brightness and colour. The input is the 4K map converted from EXR to an sRGB image (on macOS: `sips -s format png starmap_2020_4k.exr --out starmap.png`).
- **`cobra_export.py <king_cobra folder> <assets/models> <assets/tex>`** cuts the raised neck, hood and head out of the King Cobra glTF, writes `shesha_hood.json`/`.js`, and retints the skin textures to `naga_*.jpg`.
- **`puranic_stars.py <assets/sky/stars.json> <out.json>`** matches the stars named in the Puranic sky (Dhruva, the seven sages, the nakshatras) to the stars drawn on the page. Its output is the `PSTARS` table in `index.html`.

The `.js` copies of the assets (`starmap-*.js`, `stars.js`, `textures.js`, `shesha_hood.js`) hold the same data as data URLs, so the page also works when opened straight from disk.
