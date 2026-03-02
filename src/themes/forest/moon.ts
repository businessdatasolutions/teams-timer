// Rising moon with crescent shadow and glow

import { clamp, lerp } from '../../utils/math';

export class Moon {
  private x: number;
  private y: number;
  private startY: number;
  private endY: number;
  private radius: number;

  constructor(w: number, h: number) {
    this.x = w * 0.78; // right side of sky
    this.startY = h * 0.85;
    this.endY = h * 0.18;
    this.y = this.startY;
    this.radius = Math.min(w, h) * 0.04;
  }

  update(_dt: number, progress: number): void {
    // Moon appears at progress 0.25, fully risen by ~0.9
    const moonT = clamp((progress - 0.25) / 0.65, 0, 1);
    // Ease-out curve for natural rise
    const eased = 1 - (1 - moonT) * (1 - moonT);
    this.y = lerp(this.startY, this.endY, eased);
  }

  render(ctx: CanvasRenderingContext2D, progress: number): void {
    if (progress < 0.25) return;

    const moonAlpha = clamp((progress - 0.25) / 0.15, 0, 1); // fade in over first 15% of appearance

    // Outer glow
    const glowRadius = this.radius * 4;
    const glowGrad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, glowRadius);
    glowGrad.addColorStop(0, `rgba(200,210,240,${0.15 * moonAlpha})`);
    glowGrad.addColorStop(0.4, `rgba(180,190,220,${0.06 * moonAlpha})`);
    glowGrad.addColorStop(1, 'rgba(180,190,220,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    ctx.fillStyle = `rgba(230,235,245,${0.9 * moonAlpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Crescent shadow (offset circle to create crescent)
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0,0,0,${0.7 * moonAlpha})`;
    ctx.beginPath();
    ctx.arc(this.x + this.radius * 0.4, this.y - this.radius * 0.15, this.radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Re-draw a subtle inner glow on the visible crescent
    ctx.fillStyle = `rgba(240,245,255,${0.15 * moonAlpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  getX(): number { return this.x; }
  getY(): number { return this.y; }
}
