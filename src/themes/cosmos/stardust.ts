/**
 * 3D perspective star tunnel – stars fly toward the camera,
 * stretching into lines during warp. Inspired by cosmos.html's Three.js starfield.
 */
export class StardustField {
  private xs: Float32Array;
  private ys: Float32Array;
  private zs: Float32Array;
  private sizes: Float32Array;
  private count: number;
  private maxZ = 2000;
  private focalLength = 300;
  warpFactor = 0; // 0 = idle drift, 1 = full warp

  constructor(count: number, _w: number, _h: number) {
    this.count = count;
    this.xs = new Float32Array(count);
    this.ys = new Float32Array(count);
    this.zs = new Float32Array(count);
    this.sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.spawn(i);
    }
  }

  private spawn(i: number): void {
    const r = 200 + Math.random() * 800;
    const angle = Math.random() * Math.PI * 2;
    this.xs[i] = Math.cos(angle) * r;
    this.ys[i] = Math.sin(angle) * r;
    this.zs[i] = Math.random() * this.maxZ;
    this.sizes[i] = 0.5 + Math.random() * 1.5;
  }

  update(dt: number, _w: number, _h: number): void {
    const speed = (0.3 + this.warpFactor * 4) * (dt / 16.67);

    for (let i = 0; i < this.count; i++) {
      this.zs[i] -= speed * (1 + this.sizes[i]);
      if (this.zs[i] < 1) {
        this.spawn(i);
        this.zs[i] = this.maxZ;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    const fl = this.focalLength;
    const stretch = 1 + this.warpFactor * 35;

    for (let i = 0; i < this.count; i++) {
      const z = this.zs[i];
      const sx = (this.xs[i] / z) * fl + cx;
      const sy = (this.ys[i] / z) * fl + cy;
      const size = (this.sizes[i] / z) * fl * 0.15;
      const alpha = Math.min(1, (1 - z / this.maxZ) * 1.2) * 0.9;

      if (alpha <= 0) continue;

      if (stretch > 1.5) {
        // Warp streaks – draw line from current to "previous" z position
        const prevZ = z + stretch * 2;
        const prevSx = (this.xs[i] / prevZ) * fl + cx;
        const prevSy = (this.ys[i] / prevZ) * fl + cy;

        ctx.beginPath();
        ctx.moveTo(prevSx, prevSy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(200,220,255,${alpha})`;
        ctx.lineWidth = Math.max(0.5, size);
        ctx.stroke();
      } else {
        // Normal star dot
        if (size < 1.2) {
          ctx.fillStyle = `rgba(200,220,255,${alpha})`;
          ctx.fillRect(sx, sy, Math.max(0.8, size), Math.max(0.8, size));
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,220,255,${alpha})`;
          ctx.fill();
        }
      }
    }
  }
}
