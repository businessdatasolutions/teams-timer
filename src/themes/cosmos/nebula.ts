/**
 * Nebula cloud system – multiple coloured particle clouds that slowly orbit,
 * with additive blending for vibrant glow. Supports recoloring for universe switching.
 */

interface NebulaBlob {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number];
  angle: number;
  speed: number;
  orbitR: number;
  orbitCx: number;
  orbitCy: number;
}

export class Nebula {
  private blobs: NebulaBlob[] = [];
  private baseColor: [number, number, number] = [140, 40, 200];

  constructor(w: number, h: number) {
    this.generate(w, h);
  }

  setColor(color: [number, number, number]): void {
    this.baseColor = color;
    // Recolor existing blobs with variations of the new base
    for (let i = 0; i < this.blobs.length; i++) {
      const shift = (i / this.blobs.length) * 0.6 - 0.3; // -0.3 to +0.3
      this.blobs[i].color = [
        Math.max(0, Math.min(255, color[0] + shift * 120)),
        Math.max(0, Math.min(255, color[1] + shift * 120)),
        Math.max(0, Math.min(255, color[2] + shift * 120)),
      ];
    }
  }

  private generate(w: number, h: number): void {
    this.blobs = [];
    for (let i = 0; i < 6; i++) {
      const shift = (i / 6) * 0.6 - 0.3;
      const color: [number, number, number] = [
        Math.max(0, Math.min(255, this.baseColor[0] + shift * 120)),
        Math.max(0, Math.min(255, this.baseColor[1] + shift * 120)),
        Math.max(0, Math.min(255, this.baseColor[2] + shift * 120)),
      ];
      const cx = w * (0.2 + Math.random() * 0.6);
      const cy = h * (0.2 + Math.random() * 0.6);
      this.blobs.push({
        x: cx,
        y: cy,
        radius: Math.min(w, h) * (0.25 + Math.random() * 0.3),
        color,
        angle: Math.random() * Math.PI * 2,
        speed: 0.00002 + Math.random() * 0.00003,
        orbitR: 30 + Math.random() * 60,
        orbitCx: cx,
        orbitCy: cy,
      });
    }
  }

  resize(w: number, h: number): void {
    this.generate(w, h);
  }

  update(dt: number): void {
    for (const b of this.blobs) {
      b.angle += b.speed * dt;
      b.x = b.orbitCx + Math.cos(b.angle) * b.orbitR;
      b.y = b.orbitCy + Math.sin(b.angle) * b.orbitR;
    }
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const prevOp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';

    for (const b of this.blobs) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      const [r, g, bl] = b.color;
      grad.addColorStop(0, `rgba(${r},${g},${bl},0.12)`);
      grad.addColorStop(0.4, `rgba(${r},${g},${bl},0.05)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.globalCompositeOperation = prevOp;
  }
}
