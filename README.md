# Loka

An explorable universe of Hindu mythology. You travel through a 3D cosmos of the fourteen worlds of the Puranas, and each world opens into sourced, scroll-driven stories.

*Loka is a working title. This is an early prototype.*

## Run it

Serve the folder and open it in a browser:

```bash
python3 -m http.server 5173
```

Then go to <http://localhost:5173>. You can also open `index.html` straight from disk; it loads more slowly, because the images ship as data URLs for that case.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The cosmos homepage: the egg of the universe, the fourteen worlds, Mount Meru, Ananta Shesha and the Puranic sky |
| `saga.html` | The Narasimha saga, the first story |
| `assets/sky/` | The real night sky (NASA star map) and the 7,000 brightest stars taken from it |
| `assets/tex/` | Textures for the oceans, continents, Meru and Shesha |
| `assets/models/` | Shesha's hooded heads |
| `tools/` | Scripts that made the processed assets |

Three.js 0.160 and the fonts load from public CDNs, so there's no build step.

## Working on it

`main` is the working version. New work goes on its own branch and comes back into `main` through a pull request.

## Credits

- **Sky:** [Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851), NASA/Goddard Scientific Visualization Studio (from Hipparcos-2, Tycho-2 and Gaia DR2).
- **Land and rock textures:** [aerial_grass_rock](https://polyhaven.com/a/aerial_grass_rock) and [cliff_side](https://polyhaven.com/a/cliff_side), Poly Haven, CC0.
- **Water normals:** [three.js](https://github.com/mrdoob/three.js) example texture, MIT.
- **Shesha's heads:** ["King Cobra"](https://sketchfab.com/3d-models/king-cobra-a8dab84cd4fc428bbcfe194e3ac14d06) by Anthony Yanez, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cut to the neck, hood and head, and retinted.
- **3D engine:** [three.js](https://threejs.org), MIT.

## Source files not in the repo

The original downloads are left out to keep the repo small. Fetch them again from the links above if you need to rebuild the processed assets:

- `assets/nasa-starmap/starmap_2020_4k.exr`: the 4K star map from NASA SVS 4851
- `assets/_downloads/`: the 2K Poly Haven textures, the three.js `waternormals.jpg`, and the King Cobra glTF

## License

No license has been chosen yet, so all rights are reserved. The third-party assets above keep their own licenses.
