import { SimplexNoise } from '../../utils/noise';

export class StardustField {
  private xs: Float32Array;
  private ys: Float32Array;
  private vxs: Float32Array;
  private vys: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;
  private count: number;
  private noise = new SimplexNoise(7);
  private time = 0;

  constructor(count: number, w: number, h: number) {
    this.count = count;
    this.xs = new Float32Array(count);
    this.ys = new Float32Array(count);
    this.vxs = new Float32Array(count);
    this.vys = new Float32Array(count);
    this.sizes = new Float32Array(count);
    this.alphas = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.xs[i] = Math.random() * w;
      this.ys[i] = Math.random() * h;
      this.sizes[i] = 0.5 + Math.random() * 2.5;
      this.alphas[i] = 0.3 + Math.random() * 0.7;
    }
  }

  update(dt: number, w: number, h: number): void {
    this.time += dt * 0.0005;
    const scale = dt / 16.67;

    for (let i = 0; i < this.count; i++) {
      // Noise-driven velocity
      const nx = this.noise.noise2D(this.xs[i] * 0.002 + this.time, this.ys[i] * 0.002);
      const ny = this.noise.noise2D(this.xs[i] * 0.002, this.ys[i] * 0.002 + this.time);
      this.vxs[i] = nx * 0.5 * this.sizes[i];
      this.vys[i] = ny * 0.5 * this.sizes[i];

      this.xs[i] += this.vxs[i] * scale;
      this.ys[i] += this.vys[i] * scale;

      // Wrap
      if (this.xs[i] < 0) this.xs[i] += w;
      if (this.xs[i] > w) this.xs[i] -= w;
      if (this.ys[i] < 0) this.ys[i] += h;
      if (this.ys[i] > h) this.ys[i] -= h;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.count; i++) {
      const s = this.sizes[i];
      const a = this.alphas[i];

      if (s < 1.5) {
        // Small particles as simple rects for performance
        ctx.fillStyle = `rgba(200,210,255,${a})`;
        ctx.fillRect(this.xs[i], this.ys[i], s, s);
      } else {
        ctx.beginPath();
        ctx.arc(this.xs[i], this.ys[i], s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,210,255,${a})`;
        ctx.fill();
      }
    }
  }
}
