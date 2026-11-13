# Loka

An explorable universe of Hindu mythology. You travel through a 3D cosmos of the fourteen worlds of the Puranas, and each world opens into sourced, scroll-driven stories.

Created by Aarya Rajgor.

*Loka is a working title. This is an early prototype.*

## Run it

Serve the folder and open it in a browser:

```bash
python3 -m http.server 5173
```

Then go to <http://localhost:5173>. The page needs a server: browsers won't run its scripts straight from a file, so opening `index.html` from disk only shows a note saying so.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The cosmos homepage's markup: header, rail, footer, and where the scripts load |
| `css/loka.css` | All the page's styles |
| `css/fonts.css`, `fonts/` | The four typefaces, served from the repo, with their licences |
| `js/content.js` | The words: every world's text, sources, Versions notes, read mode's notes, and where the camera goes for each |
| `js/page.js` | The page: builds each world's text, the rail and read mode, and turns scrolling into a camera path |
| `js/cosmos.js` | The 3D scene: the night sky, the egg, the fourteen worlds, Mount Meru and Ananta Shesha |
| `js/galaxy.js` | A world as a living galaxy: stars on their own orbits, with gas, star-forming knots and dust along spiral arms that hold their shape while everything flows through them |
| `js/nebula.js` | A world of living fire: sharp flame and smoke painted once at load in high detail, then layered through the world's thickness round a burning star (Tapoloka) |
| `vendor/three/` | three.js 0.160.0 and the add-ons the scene uses |
| `assets/sky/` | The real night sky (NASA star map) and the 7,000 brightest stars taken from it (`stars.bin`, packed from `stars.json`) |
| `assets/tex/` | Textures for the oceans, continents, Meru and Shesha |
| `assets/models/` | Shesha's hooded heads |
| `tools/` | Scripts that made the processed assets |

Everything is served from the repo, with no build step: the scripts are plain ES modules.

## Working on it

`main` is the working version. New work goes on its own branch and comes back into `main` through a pull request.

In progress on their own branches:

- `narasimha-saga`: the first story, being improved before it goes live
- `puranic-sky`: Dhruva, the seven sages, the 28 nakshatras and the Shishumara, drawn over the real stars
- `time-dial`: the parked time dial for the four ages, kept as it was before the code was split into files

## Credits

- **Texts:** read online in [H. H. Wilson’s Vishnu Purana](https://sacred-texts.com/book/the-vishnu-purana), the [Bhagavata Purana](https://vedabase.io/en/library/sb/) and [Bhagavad Gita](https://vedabase.io/en/library/bg/) (Bhaktivedanta Book Trust), [K. M. Ganguli’s Mahabharata](https://sacred-texts.com/categories/mahabharata) and [R. T. H. Griffith’s Ramayana](https://sacred-texts.com/book/ramayan-of-valmiki).
- **Sky:** [Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851), NASA/Goddard Scientific Visualization Studio (from Hipparcos-2, Tycho-2 and Gaia DR2).
- **Land and rock textures:** [aerial_grass_rock](https://polyhaven.com/a/aerial_grass_rock) and [cliff_side](https://polyhaven.com/a/cliff_side), Poly Haven, CC0.
- **Water normals:** [three.js](https://github.com/mrdoob/three.js) example texture, MIT.
- **Shesha's heads:** ["King Cobra"](https://sketchfab.com/3d-models/king-cobra-a8dab84cd4fc428bbcfe194e3ac14d06) by Anthony Yanez, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cut to the neck, hood and head, and retinted.
- **3D engine:** [three.js](https://threejs.org), MIT, served from `vendor/three/`.
- **Typefaces:** Cormorant Garamond, Newsreader, Inter and Tiro Devanagari Sanskrit, SIL Open Font License, served from `fonts/` (licences included).

## Source files not in the repo

The original downloads are left out to keep the repo small. Fetch them again from the links above if you need to rebuild the processed assets:

- `assets/nasa-starmap/starmap_2020_4k.exr`: the 4K star map from NASA SVS 4851
- `assets/_downloads/`: the 2K Poly Haven textures, the three.js `waternormals.jpg`, and the King Cobra glTF

## License

No license has been chosen yet, so all rights are reserved by Aarya Rajgor. The third-party assets above keep their own licenses.
