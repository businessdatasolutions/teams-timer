// Soft, volumetric light shafts filtering through the tree canopy
// Rendered as many overlapping soft radial gradient ellipses along each ray's path
// to create a diffused, atmospheric look rather than hard geometric shapes.

import { SimplexNoise } from '../../utils/noise';
import { clamp } from '../../utils/math';

interface Ray {
  x: number;        // horizontal center (fraction of width)
  angle: number;     // radians — very slight tilt
  widthTop: number;  // width at the source (narrow)
  widthBot: number;  // width at the ground (spreads out)
  opacity: number;   // base opacity multiplier
  drift: number;     // horizontal drift speed
  noiseOffset: number;
}

export class GodRays {
  private rays: Ray[];
  private noise = new SimplexNoise(33);
  private time = 0;

  constructor() {
    // Fewer rays, more varied, subtle
    this.rays = [
      { x: 0.12, angle: 0.06, widthTop: 0.015, widthBot: 0.07, opacity: 1.0, drift: 0.18, noiseOffset: 0 },
      { x: 0.28, angle: -0.04, widthTop: 0.012, widthBot: 0.06, opacity: 0.7, drift: 0.25, noiseOffset: 50 },
      { x: 0.44, angle: 0.08, widthTop: 0.018, widthBot: 0.08, opacity: 0.9, drift: 0.15, noiseOffset: 100 },
      { x: 0.62, angle: -0.05, widthTop: 0.010, widthBot: 0.055, opacity: 0.6, drift: 0.30, noiseOffset: 150 },
      { x: 0.78, angle: 0.03, widthTop: 0.014, widthBot: 0.065, opacity: 0.8, drift: 0.22, noiseOffset: 200 },
      { x: 0.91, angle: -0.07, widthTop: 0.011, widthBot: 0.05, opacity: 0.5, drift: 0.28, noiseOffset: 250 },
    ];
  }

  update(dt: number, _progress: number): void {
    this.time += dt * 0.001;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number): void {
    // Fade out as twilight approaches — gone by progress 0.5
    const masterOpacity = clamp(1 - progress / 0.5, 0, 1) * 0.12;
    if (masterOpacity < 0.002) return;

    const prevComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'screen';

    for (const ray of this.rays) {
      // Slow horizontal drift
      const driftX = Math.sin(this.time * ray.drift) * w * 0.015;
      const cx = ray.x * w + driftX;

      // Noise-driven intensity variation along the ray (simulates canopy gaps)
      const rayNoise = this.noise.noise2D(ray.noiseOffset + this.time * 0.1, 0);
      const rayAlpha = masterOpacity * ray.opacity * (0.6 + 0.4 * rayNoise);
      if (rayAlpha < 0.002) continue;

      // Draw the ray as many overlapping soft ellipses along its length
      // This creates the diffused, volumetric look
      const steps = 16;
      for (let s = 0; s < steps; s++) {
        const t = s / (steps - 1); // 0 at top, 1 at bottom

        // Position along the ray
        const py = t * h * 0.85;
        const px = cx + Math.sin(ray.angle) * py;

        // Width expands from top to bottom
        const halfW = (ray.widthTop + (ray.widthBot - ray.widthTop) * t) * w * 0.5;
        const ellipseH = h / steps * 1.8; // overlap between steps

        // Per-step noise for canopy interruption effect
        const stepNoise = this.noise.noise2D(
          ray.noiseOffset + s * 0.4,
          this.time * 0.15,
        );
        const stepAlpha = rayAlpha * clamp(0.3 + 0.7 * stepNoise, 0, 1);

        // Fade out toward the bottom
        const verticalFade = t < 0.15
          ? t / 0.15                    // fade in at very top
          : 1 - Math.pow(t, 2.5);       // gentle fade toward ground
        const alpha = stepAlpha * verticalFade;
        if (alpha < 0.002) continue;

        // Soft radial gradient ellipse
        const grad = ctx.createRadialGradient(px, py, 0, px, py, halfW);
        grad.addColorStop(0, `rgba(255,245,200,${alpha})`);
        grad.addColorStop(0.3, `rgba(255,240,185,${alpha * 0.6})`);
        grad.addColorStop(0.7, `rgba(255,235,170,${alpha * 0.2})`);
        grad.addColorStop(1, 'rgba(255,235,170,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(px, py, halfW, ellipseH, ray.angle * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = prevComposite;
  }
}
