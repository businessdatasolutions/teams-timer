# Teams Break Timer

A full-screen, visually immersive countdown timer designed to be screen-shared during Microsoft Teams meetings. It provides beautiful animated themes that make team breaks feel engaging and calming.

The app is entirely static and client-side — configure it via URL parameters, share your screen, and the timer auto-starts with no interaction required.

## Themes

Six built-in visual themes, each with unique animations:

| Theme | Description |
|-------|-------------|
| **Forest** (default) | Layered SVG tree silhouettes against a sky that transitions from afternoon to twilight. Features swaying trees, wandering fireflies, stars, falling leaves, and god rays. |
| **Koi Pond** | Top-down zen pond with koi fish using boids steering behavior, expanding water ripples, caustic light patterns, and pebble backgrounds. |
| **Lava Lamp** | Pure CSS gooey blobs that morph and merge. Minimal CPU cost since all animation is CSS-driven. |
| **Cosmos** | A universe-hopping experience with 12 distinct environments — nebulas, black holes, crystal clusters, auroras, and more. The scene warps to a new universe on a configurable interval, complete with a 3D perspective starfield, dynamic nebula blobs, and a location HUD. |
| **Sand** | A cellular automata sand simulation where grains fall, pile, and slide realistically. Sand emission is timed so the last grain falls exactly when the timer ends. |
| **Earth** | A 3D rotating Earth with realistic textures, atmospheric glow, cloud layer, and orbiting moon. Supports interactive orbit controls — drag to rotate, scroll to zoom. |

## URL Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `m` | number | `10` | Break duration in minutes |
| `s` | number | `0` | Additional seconds |
| `theme` | string | `forest` | Theme name (`forest`, `koi`, `lava`, `cosmos`, `sand`, `earth`) |
| `text` | string | `Break Time` | Custom message displayed on screen |
| `fish` | number | `4` | Number of koi fish (koi theme only, 1–20) |
| `warp` | number | `20` | Universe warp interval in seconds (cosmos theme only) |

### Examples

- `/?m=5` — 5-minute forest break
- `/?m=10&theme=lava&text=Coffee+Break` — 10-minute lava lamp with custom text
- `/?theme=koi&m=15&text=Lunch+Break&fish=6` — 15-minute koi pond with 6 fish
- `/?theme=cosmos&warp=30` — cosmos theme warping to a new universe every 30 seconds
- `/?theme=earth&m=10` — 10-minute break with interactive 3D Earth

## Getting Started

```bash
npm install
npm run dev
```

This starts a local dev server at `http://localhost:5173` with hot reload.

## Building for Production

```bash
npm run build
```

Outputs optimized, code-split bundles to the `dist/` folder. Each theme is lazy-loaded as a separate chunk.

To preview the production build locally:

```bash
npm run preview
```

## Deployment

The app auto-deploys to GitHub Pages on every push to `main` via the workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

**Live URL:** https://businessdatasolutions.github.io/teams-timer/

To enable deployment, go to the repo's **Settings > Pages** and set the source to **GitHub Actions**.

## Tech Stack

- **Vite** — build tool with code splitting
- **TypeScript** — strict mode
- **HTML5 Canvas 2D** — particle systems and animations
- **Three.js** — 3D rendering for the Earth theme
- **CSS3** — keyframes, gradients, filters, blend modes
- **SVG** — scalable vector graphics for theme elements
