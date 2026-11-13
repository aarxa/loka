# Asset tools

Python 3 scripts that turn the original downloads into the files in `assets/`. They need `numpy` and `Pillow`.

- **`extract_stars.py <starmap.png> <stars.json> [count]`** finds the brightest point stars in the NASA star map and writes their RA, Dec, brightness and colour. The input is the 4K map converted from EXR to an sRGB image (on macOS: `sips -s format png starmap_2020_4k.exr --out starmap.png`).
- **`cobra_export.py <king_cobra folder> <assets/models> <assets/tex>`** cuts the raised neck, hood and head out of the King Cobra glTF, writes `shesha_hood.json`, and retints the skin textures to `naga_*.jpg`.
- **`pack_stars.py <assets/sky/stars.json> <assets/sky/stars.bin>`** packs the star list into the compact binary the page loads (8 bytes a star).
