# Technical Design Document: Teams Break Timer

## Context

The Teams Break Timer is a static, full-screen countdown timer for Microsoft Teams meeting breaks. Currently, a single monolithic `koi-pond.html` (714 lines) implements one of five planned themes. This document describes the architecture for a modular, multi-theme application with shared infrastructure, lazy loading, and a clean build pipeline.

---

## Project Structure

**Toolchain**: Vite + vanilla TypeScript. Zero runtime dependencies.

```
teams-timer/
  index.html                      # SPA shell — just <div id="app"> + module script
  vite.config.ts
  tsconfig.json
  package.json
  public/                         # Static assets copied as-is
    assets/
      pond-bg.png
  src/
    main.ts                       # Entry: parse params → load theme → start timer + loop
    params.ts                     # URL query parameter parsing
    timer.ts                      # Countdown engine (setInterval-based, not frame-coupled)
    base-theme.ts                 # Abstract BaseTheme class (lifecycle contract)
    theme-registry.ts             # Maps theme names → dynamic imports
    types.ts                      # Shared interfaces (TimerState, AppConfig)
    utils/
      noise.ts                    # Simplex noise (~100 LOC, no library)
      particles.ts                # Object-pool particle system
      color.ts                    # Color lerp, hex↔rgb conversion
      math.ts                     # lerp, clamp, distance, normalize
    themes/
      forest/
        index.ts                  # ForestTheme extends BaseTheme
        trees.ts                  # SVG tree generation + sway CSS
        fireflies.ts              # Canvas firefly particles
      lava/
        index.ts                  # LavaTheme extends BaseTheme
        blobs.ts                  # CSS gooey blob DOM management
      koi/
        index.ts                  # KoiTheme extends BaseTheme
        fish.ts                   # Koi class (boids steering + rendering)
        ripples.ts                # Ripple system
        caustics.ts               # Caustic light layers
        pebbles.ts                # Offscreen pebble/vignette background
      cosmos/
        index.ts                  # CosmosTheme extends BaseTheme
        stardust.ts               # Noise-driven particle field
        nebula.ts                 # Gradient nebula layer
        shooting-stars.ts         # Rare streak spawner
      sand/
        index.ts                  # SandTheme extends BaseTheme
        automata.ts               # Cellular automata grid (Uint8Array)
        emitter.ts                # Timed sand grain emitters
```

---

## Core Modules

### `params.ts` — URL Parameter Parsing

```typescript
interface AppConfig {
  minutes: number;        // ?m=, default 10
  seconds: number;        // ?s=, default 0
  theme: string;          // ?theme=, default "forest"
  text: string;           // ?text=, default "Break Time"
  totalSeconds: number;   // computed: minutes * 60 + seconds
}
```

Parses `URLSearchParams` with safe defaults. Clamps negative values to 0. Falls back to defaults for missing or invalid params.

> **Migration note**: Current `koi-pond.html` uses the `theme` param for display text. This will be corrected to match the PRD where `theme` selects the visual and `text` sets the display message.

### `timer.ts` — Countdown Engine

- Uses `setInterval(fn, 1000)` — decoupled from the render loop so countdown is frame-rate independent
- Exposes `TimerState`:
  - `totalSeconds` — remaining seconds
  - `initialTotalSeconds` — starting value
  - `progress` — 0 (start) → 1 (complete)
  - `isComplete` — boolean
  - `formatted` — `"MM:SS"` string
- Callbacks: `onTick(state)` each second, `onComplete(state)` when done
- `start()` / `stop()` methods (supports future pause/resume without architectural changes)

### `base-theme.ts` — Abstract Theme Class

Every theme implements this lifecycle contract:

| Method | Purpose |
|--------|---------|
| `init(config)` | Create DOM elements, entities, offscreen canvases |
| `resize(w, h)` | Rebuild cached assets, recompute layout |
| `update(dt, timerState)` | Physics, movement, time-based state changes |
| `render(ctx)` | Draw to main canvas |
| `onComplete()` | Play end-of-break visual cue |
| `dispose()` | Remove DOM elements and free resources |

The base class creates the main `<canvas>` element and provides the container `<div>`. Each theme creates its own timer overlay DOM in `init()` since visual treatment differs significantly between themes (stone in koi, cloud text in forest, glowing hologram in cosmos, etc.).

**Lava special case**: Primarily CSS-driven, not canvas-driven. The canvas is hidden or unused; `update()` adjusts blob color palette via timer progress; `render()` is a no-op. The gooey blobs are CSS-animated DOM elements managed in `init()`.

### `theme-registry.ts` — Lazy Loading

```typescript
const registry: Record<string, () => Promise<{ default: ThemeConstructor }>> = {
  forest: () => import('./themes/forest/index'),
  lava:   () => import('./themes/lava/index'),
  koi:    () => import('./themes/koi/index'),
  cosmos: () => import('./themes/cosmos/index'),
  sand:   () => import('./themes/sand/index'),
};
```

Vite's dynamic `import()` automatically code-splits each theme into its own chunk. Only the selected theme's JavaScript loads at runtime. Unknown theme names fall back to `forest` (the default).

### `main.ts` — Entry Point

Orchestration flow:

1. Parse URL params → `AppConfig`
2. Dynamically load selected theme via registry
3. `theme.init(config)` — set up visuals
4. `theme.resize(innerWidth, innerHeight)` — initial layout
5. Wire `window.resize` listener → `theme.resize()`
6. Create `Timer` with tick and complete callbacks
7. Start `requestAnimationFrame` loop:
   - Compute `dt = now - lastTime` (capped at 50ms to prevent spiral-of-death after tab backgrounding)
   - `theme.update(dt, timer.getState())`
   - `theme.render(ctx)`
8. `timer.start()`

---

## Shared Utilities (`src/utils/`)

### `noise.ts` — Simplex Noise

Self-contained ~100 LOC implementation. No external library. Used by:
- **Cosmos**: particle velocity perturbation for fluid, cloud-like drift
- **Forest**: firefly wandering paths

### `particles.ts` — Object-Pool Particle System

```typescript
class ParticlePool {
  constructor(maxCount: number);
  emit(props: Partial<Particle>): Particle | null;
  update(dt: number, updater: (p: Particle, dt: number) => boolean): void;
  forEach(fn: (p: Particle) => void): void;
}
```

Pre-allocates particles to avoid GC pressure. The `updater` callback returns `false` to kill a particle. Used by forest fireflies and cosmos stardust. Sand uses its own grid system instead.

### `color.ts` — Color Interpolation

`lerpColor(a, b, t)`, `hexToRgb()`, `rgbToHex()`. Every theme uses time-progress palette shifts — this utility avoids duplicating the logic.

### `math.ts` — Vector & Math Helpers

`lerp()`, `clamp()`, `distance()`, `normalize()`. Small, pure functions used throughout.

---

## Animation & Performance

### Frame-Rate Independence

All movement scales by `dt` (milliseconds since last frame). The koi theme's existing physics (tuned for 60fps) will be migrated by scaling with `dt / 16.67`.

### Particle Budgets

| Theme  | Primary Cost         | Budget                                |
|--------|----------------------|---------------------------------------|
| Forest | Fireflies + SVG sway | 30–60 particles; SVG sway is cheap    |
| Lava   | CSS blobs            | 5–8 DOM elements; no canvas cost      |
| Koi    | Fish + ripples       | 4–5 fish, 20–30 active ripples        |
| Cosmos | Stardust + nebula    | 800–2000 particles, 3–5 gradients     |
| Sand   | Grid iteration       | ~2px cell grid, `Uint8Array` storage  |

### Offscreen Canvas Caching

Render static or slow-changing visuals once to offscreen canvases, blit each frame:

| Theme  | Cached Layers                                                |
|--------|--------------------------------------------------------------|
| Koi    | Pebble background + vignette (existing pattern)              |
| Forest | Sky gradient (re-render on significant progress change only) |
| Cosmos | Nebula gradients (rotate the draw, don't re-render)          |
| Sand   | Settled sand (only re-render active falling zone)            |

### Adaptive Quality

A `PerformanceMonitor` tracks a rolling 60-frame FPS average:
- If sustained < 40fps → reduce quality level (fewer particles, fewer caustic layers, larger sand grid cells)
- If sustained > 55fps → gradually restore quality
- Quality level exposed as `0.3–1.0` multiplier that themes use to scale their budgets

### Theme-Specific Optimizations

**Sand:**
- `Uint8Array` grid (0 = empty, 1+ = sand color index) — no object allocations
- Double-buffered: read grid A → write grid B → swap each frame
- Dirty-region tracking: only iterate rows with active (still-moving) grains
- Render via `ImageData` direct pixel writes, not `fillRect` calls

**Cosmos:**
- `Float32Array` struct-of-arrays layout for particle positions/velocities
- Particles < 1.5px rendered as `ImageData` pixel writes instead of `ctx.arc()` calls
- Batch larger particles by size to minimize canvas state changes

---

## Theme Implementation Notes

### Forest — The Breathing Forest

**Layer stack**: CSS background (sky gradient) → SVG elements (trees) → Canvas (fireflies) → DOM (timer text as wispy cloud)

- **Trees**: SVG silhouette layers with CSS `@keyframes` sway at overlapping durations (7.3s, 8.1s, 9.7s per layer) to break synchronization
- **Fireflies**: Canvas particles with noise-perturbed velocity for smooth wandering curves; pulsing brightness
- **Sky**: CSS `linear-gradient` background interpolated from afternoon orange/blue → twilight purple/navy based on `timerState.progress`
- **End cue**: All fireflies converge to center

### Lava — The Fluid Lava Lamp

**Approach**: Pure CSS — no canvas needed

- **Gooey effect**: Wrapper `<div>` with `filter: blur(20px) contrast(30)` containing 5–8 circular child `<div>`s
- **Blob animation**: CSS `@keyframes` for position movement + 8-point `border-radius` morphing
- **Timer text**: Bold white with `mix-blend-mode: difference` reacting to blob colors beneath
- **Color shift**: Palette transitions warm (reds, oranges) → cool (blues, purples) via JS updating CSS custom properties based on progress
- **End cue**: Blobs settle to bottom and slow down

### Koi — The Koi Pond (port from `koi-pond.html`)

**Approach**: Canvas-primary with DOM overlay for stone/timer

- **Fish**: Boids steering algorithm (wander, edge avoidance, obstacle avoidance) with detailed body rendering — history trail, fins with rays, spots, barbels, eyes, shadows
- **Ripples**: Expanding/fading stroke circles spawned randomly and from koi movements
- **Caustics**: 5 drifting translucent layers at different speeds
- **Color grading**: Warm gold → cool blue overlay based on progress
- **End cue**: Dusk overlay darkens; "Time to return" message fades in

### Cosmos — The Cosmic Dust / Nebula

**Approach**: Canvas-primary with DOM overlay for glowing timer

- **Stardust**: 800–2000 particles with Simplex noise-driven velocity perturbation for fluid cloud-like drift; parallax by size (larger = faster foreground)
- **Nebula**: 2–3 large radial gradients on offscreen canvas, slowly rotated each frame
- **Shooting stars**: Random interval (10–30s), rendered as gradient-stroked bright line with motion blur
- **Progress ring**: Orbital `ctx.arc()` ring around timer based on `timerState.progress`
- **Timer text**: Glowing center with slowly pulsing holographic text below

### Sand — The Cellular Sandglass

**Approach**: Canvas with cellular automata grid

- **Automata rules**: If cell below empty → fall down. If below full → check bottom-left and bottom-right, move diagonally if empty.
- **Emission rate**: `totalGrains / totalSeconds` per second — all sand falls exactly when timer hits 00:00
- **Text as obstacle**: Render custom text to offscreen canvas → sample pixel data to create collision mask in grid
- **Palette**: Monochromatic — dark charcoal background with soft gold/white sand
- **End cue**: Final grain falls, sand settles completely

---

## Build & Deployment

### Vite Config

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',                    // Relative paths for any static host
  build: {
    target: ['chrome90', 'edge90', 'firefox90', 'safari15'],
    outDir: 'dist',
  }
});
```

### Package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Build Output

```
dist/
  index.html                (~1KB)
  assets/main-[hash].js     (core: timer, params, registry — ~5–8KB gzipped)
  assets/[theme]-[hash].js  (one per theme — ~3–10KB gzipped each)
```

Initial page load for any single theme: **~15–20KB gzipped total**.

### Deployment

GitHub Action: `checkout` → `npm ci && npm run build` → publish `dist/` to GitHub Pages. Compatible with any static host (Vercel, Netlify, Azure Static Web Apps).

---

## Testing & Verification

### Unit Tests (Vitest)

| Test File | Coverage |
|-----------|----------|
| `params.test.ts` | Defaults, edge cases, missing/invalid values, negative numbers |
| `timer.test.ts` | Countdown, completion callback, `MM:SS` formatting, 0-second edge case |
| `utils/math.test.ts` | Pure function correctness |
| `utils/color.test.ts` | Color interpolation, hex↔rgb roundtrip |
| `utils/noise.test.ts` | Deterministic output for same seed, value range |

### Manual Verification

- **Quick lifecycle**: `/?theme=koi&m=0&s=10` — full timer cycle including end animation in 10 seconds
- **Theme gallery**: Dev-mode page rendering all 5 themes side-by-side at small viewports
- **FPS overlay**: `/?fps=1` shows live FPS counter in dev mode
- **Performance**: Chrome DevTools CPU 4x throttle to simulate mid-range hardware
- **Cross-browser**: Chrome, Edge, Firefox, Safari — focus on canvas performance and CSS `filter` support (lava theme)

---

## Implementation Order

| Step | Task | Validates |
|------|------|-----------|
| 1 | Scaffold: Vite + TS config, `index.html`, `package.json` | Build pipeline |
| 2 | Core: `params.ts`, `timer.ts`, `base-theme.ts`, `theme-registry.ts`, `types.ts` | Shared contracts |
| 3 | Koi migration: port `koi-pond.html` into modular theme | BaseTheme lifecycle |
| 4 | Shared utils: `noise.ts`, `particles.ts`, `color.ts`, `math.ts` | Reusable infrastructure |
| 5 | Forest theme | SVG + canvas hybrid |
| 6 | Lava theme | CSS-only within BaseTheme |
| 7 | Cosmos theme | High particle count + noise |
| 8 | Sand theme | Cellular automata + grid |
| 9 | Polish: adaptive quality, FPS overlay, cross-browser fixes | Production readiness |
| 10 | Deploy: GitHub Actions, README with URL examples | CI/CD |
