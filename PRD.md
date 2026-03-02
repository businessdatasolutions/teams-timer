# Teams Break Timer — Product Requirements Document

## Overview

A full-screen, visually immersive break timer designed to be shared during Microsoft Teams meetings. The host opens a URL, shares their screen, and the team enjoys a beautiful animated countdown. Everything is configured via URL query parameters — no backend, no login, no setup.

## Problem Statement

Teams meetings need breaks, but there's no elegant way to signal "we're on break" with a shared visual countdown. Current solutions are either ugly countdown websites or static slides. This tool provides a calming, visually rich break experience that keeps the team informed of remaining time.

## Goals

- Zero-friction usage: open a URL, share screen, done
- Beautiful, organic animations that feel calming and alive
- Fully configurable via URL query parameters
- No backend — runs entirely in the browser as a static site
- Works reliably on modern browsers (Chrome, Edge, Firefox, Safari)

## User Flow

1. Host constructs a URL: `https://<domain>/?m=5&theme=forest`
2. Host opens the URL in their browser
3. Host shares their browser tab/screen in the Teams meeting
4. The timer starts automatically and counts down
5. When the timer reaches 00:00, a gentle visual/audio cue signals the break is over

## URL Query Parameters

| Parameter | Type   | Default       | Description                          |
|-----------|--------|---------------|--------------------------------------|
| `m`       | number | `10`          | Break duration in minutes            |
| `s`       | number | `0`           | Additional seconds (added to `m`)    |
| `theme`   | string | `forest`      | Visual theme (see Themes below)      |
| `text`    | string | `Break Time`  | Custom message displayed on screen   |

Examples:
- `/?m=5` — 5-minute break, forest theme, "Break Time" text
- `/?m=10&theme=lava&text=Coffee+Break` — 10-min, lava lamp, custom text
- `/?theme=koi&m=15&text=Lunch+Break` — 15-min, koi pond
- `/?s=30` — 30-second timer (useful for quick stretch)

## Themes

### 1. `forest` — The Breathing Forest (Default)

**Mood:** Nature, calming, twilight transition

**Visuals:**
- Layered flat-vector forest silhouettes against a gradient sky
- Timer in soft, semi-transparent sans-serif font centered in the sky
- Custom text appears as a wispy, drifting cloud below the timer

**Animations:**
- Trees sway with overlapping sine waves (slightly different durations per layer: 7.3s, 8.1s, etc.) to simulate natural wind
- Fireflies wander the lower half using smooth random-noise paths, pulsing in brightness
- Sky gradient shifts from bright afternoon (orange/blue) to deep twilight (purple/navy) as time elapses

**Tech:** SVG tree layers, CSS gradient sky, canvas fireflies with wandering algorithm

---

### 2. `lava` — The Fluid Lava Lamp

**Mood:** Abstract, hypnotic, modern

**Visuals:**
- Large morphing color blobs floating against a dark background
- Timer in bold, crisp white — the only sharp element on screen
- Custom text in matching white with `mix-blend-mode` reacting to blobs beneath

**Animations:**
- Blobs morph shape continuously (8-point border-radius animation)
- Gooey merging when blobs overlap (CSS blur + contrast trick)
- Color palette shifts from warm (reds, oranges) to cool (blues, purples) as timer counts down

**Tech:** Pure CSS gooey effect (`filter: blur(20px) contrast(30)`), CSS keyframes for movement and shape

---

### 3. `koi` — The Koi Pond

**Mood:** Zen, meditative, top-down view

**Visuals:**
- Top-down view of a clear pond with pebbles
- Timer etched into a central stone in elegant thin serif
- Custom text carved into the same stone below the timer

**Animations:**
- 3–5 koi fish swim with boids-like steering: constant forward velocity, wall avoidance, random wandering
- Water ripples spawn randomly — expanding circles that fade out
- Light caustics shift slowly across the pond floor
- Shadow creeps across the pond as time elapses

**Tech:** Canvas for fish, ripples, and caustics; boids steering algorithm

---

### 4. `cosmos` — The Cosmic Dust / Nebula

**Mood:** Space, ambient, vast

**Visuals:**
- Deep space with a glowing timer at center
- Orbital ring around the timer acts as progress indicator
- Custom text below the ring with a glowing, slowly pulsing holographic look

**Animations:**
- Thousands of drifting stardust particles with parallax (larger = faster foreground, smaller = slower background)
- Nebula cloud slowly rotates and shifts in density
- Rare shooting stars streak across at random 10–30s intervals

**Tech:** Canvas with Perlin/Simplex noise-driven particle velocities; radial gradients for nebula; `ctx.arc()` for orbital progress ring

---

### 5. `sand` — The Cellular Sandglass

**Mood:** Physics, minimalist, satisfying

**Visuals:**
- Minimalist split-screen with large timer in the center
- Monochromatic palette (dark charcoal + soft gold/white sand)
- Custom text in the top half — sand particles treat it as a physical obstacle and bounce around it

**Animations:**
- Sand grains fall from random emitters at the top
- Cellular automata physics: grains pile into pyramids, slide down slopes, settle organically
- Emission rate tied to timer so all sand has fallen exactly when time runs out

**Tech:** Canvas with grid-based cellular automata (check below, then bottom-left/bottom-right); no heavy physics library

---

## Timer Behavior

- Timer starts automatically on page load
- Displays as `MM:SS` format (e.g., `05:00`, `00:30`)
- When timer reaches `00:00`:
  - A gentle visual cue plays (theme-specific: e.g., all fireflies converge in forest, blobs settle in lava)
  - Optional: a soft chime sound (muted by default; future enhancement)
  - The display shows `00:00` and a "Break's over!" message fades in

## Technical Requirements

### Architecture
- Static single-page application (HTML + CSS + JS)
- No framework required — vanilla JS is fine, but a lightweight bundler (Vite) is acceptable
- All assets self-contained (no external CDN dependencies at runtime)
- Deployable to any static host (GitHub Pages, Vercel, Netlify, Azure Static Web Apps)

### Performance
- Target 60fps on mid-range hardware for all themes
- Canvas-based themes should use `requestAnimationFrame`
- Particle counts should be calibrated to maintain performance (degrade gracefully on slower machines)
- Keep bundle size small — no heavy libraries

### Browser Support
- Chrome 90+, Edge 90+, Firefox 90+, Safari 15+
- Must work when screen-shared in Teams (no WebGL requirement — use 2D canvas)

### Responsive Design
- Full-screen by default (`100vw x 100vh`)
- Timer and text scale proportionally to viewport
- Animations adapt to viewport size (e.g., fewer particles on smaller screens)

## Non-Goals (Out of Scope for v1)

- User accounts or saved preferences
- Backend or database
- Sound/audio
- Pause/resume controls
- Mobile-specific optimizations
- Accessibility beyond basic color contrast on timer text
- Theme editor or customization beyond query parameters

## Future Considerations

- Additional themes contributed by the community
- Sound toggle with ambient audio per theme
- Preset URL builder UI (a simple form that generates the URL)
- QR code display so attendees can open the timer on their own devices
- Integration with Teams app/tab SDK
