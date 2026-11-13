# Asset tools

Python 3 scripts that turn the original downloads into the files in `assets/`. They need `numpy` and `Pillow`.

- **`extract_stars.py <starmap.png> <stars.json> [count]`** finds the brightest point stars in the NASA star map (the page uses 20000 as the count; duplicates merge to about 16,000) and writes their RA, Dec, brightness and colour. The input is the 4K map converted from EXR to an sRGB image (on macOS: `sips -s format png starmap_2020_4k.exr --out starmap.png`).
- **`cobra_export.py <king_cobra folder> <assets/models> <assets/tex>`** cuts the raised neck, hood and head out of the King Cobra glTF, writes `shesha_hood.json`, and retints the skin textures to `naga_*.jpg`.
- **`sky_background.py <starmap-4k.jpg> <stars.json> <sky-4k.jpg> <sky-2k.jpg>`** paints the stars in `stars.json` out of the star map, so they aren't drawn twice: the page draws them as crisp points, and the sky image keeps only the Milky Way and the faint stars.
- **`pack_stars.py <assets/sky/stars.json> <assets/sky/stars.bin>`** packs the star list into the compact binary the page loads (8 bytes a star).
