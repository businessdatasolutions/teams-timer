// Organic, wispy ground fog that drifts between tree layers
// Rendered as many soft, noise-shaped blobs rather than rectangular bands.

import { SimplexNoise } from '../../utils/noise';
import { lerp, clamp } from '../../utils/math';

// Pre-generated fog particle positions for organic shapes
interface FogPuff {
  baseX: number;   // fraction of width (0-1)
  baseY: number;   // fraction of height (0-1)
  radiusX: number; // horizontal radius (fraction of width)
  radiusY: number; // vertical radius (fraction of height)
  driftSpeed: number;
  noiseScale: number;
  seed: number;
}

export class FogSystem {
  private puffs: FogPuff[] = [];
  private noise = new SimplexNoise(77);
  private noise2 = new SimplexNoise(143);
  private time = 0;

  constructor() {
    // Generate many overlapping soft puffs at various depths
    // Concentrated in the lower-mid area (between/below tree layers)
    for (let i = 0; i < 28; i++) {
      this.puffs.push({
        baseX: Math.random(),
        baseY: 0.4 + Math.random() * 0.45, // 40%-85% of screen height
        radiusX: 0.08 + Math.random() * 0.15, // varied widths
        radiusY: 0.02 + Math.random() * 0.05, // flatter than wide (realistic fog)
        driftSpeed: (Math.random() - 0.5) * 0.03, // slow horizontal drift
        noiseScale: 0.5 + Math.random() * 1.0,
        seed: Math.random() * 1000,
      });
    }
  }

  update(dt: number, _progress: number): void {
    this.time += dt * 0.001;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number): void {
    // Fog thickens from barely visible to quite prominent
    const fogIntensity = lerp(0.02, 0.25, progress);
    if (fogIntensity < 0.005) return;

    const prevAlpha = ctx.globalAlpha;

    for (const puff of this.puffs) {
      // Noise-driven wandering position
      const wanderX = this.noise.noise2D(
        puff.seed + this.time * 0.08 * puff.noiseScale,
        puff.baseY * 5,
      ) * 0.1;
      const wanderY = this.noise2.noise2D(
        puff.seed + 500,
        this.time * 0.05 * puff.noiseScale,
      ) * 0.03;

      // Horizontal drift
      const driftX = this.time * puff.driftSpeed;

      // Wrap horizontally
      let px = ((puff.baseX + wanderX + driftX) % 1.4 + 1.4) % 1.4 - 0.2;
      const py = puff.baseY + wanderY;

      const cx = px * w;
      const cy = py * h;
      const rx = puff.radiusX * w;
      const ry = puff.radiusY * h;

      // Noise-driven opacity variation — some puffs are denser than others
      const opacityNoise = this.noise.noise2D(
        puff.seed + this.time * 0.12,
        puff.baseX * 10,
      );
      const puffAlpha = fogIntensity * clamp(0.3 + 0.7 * opacityNoise, 0, 1);
      if (puffAlpha < 0.003) continue;

      // Soft radial gradient — elliptical for realistic flat fog
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1);
      grad.addColorStop(0, `rgba(200,210,225,${puffAlpha})`);
      grad.addColorStop(0.4, `rgba(190,200,215,${puffAlpha * 0.5})`);
      grad.addColorStop(0.75, `rgba(180,190,210,${puffAlpha * 0.15})`);
      grad.addColorStop(1, 'rgba(180,190,210,0)');

      ctx.fillStyle = grad;

      // Draw as an ellipse (stretched radial gradient)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rx, ry);
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
    }

    ctx.globalAlpha = prevAlpha;
  }
}
