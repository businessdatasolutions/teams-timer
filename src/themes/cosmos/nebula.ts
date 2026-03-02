export class Nebula {
  private offscreen: HTMLCanvasElement;
  private rotation = 0;

  constructor(w: number, h: number) {
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = w;
    this.offscreen.height = h;
    this.generate(w, h);
  }

  private generate(w: number, h: number): void {
    const ctx = this.offscreen.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    const colors = [
      { x: w * 0.3, y: h * 0.4, r: w * 0.4, color: [80, 20, 120] },
      { x: w * 0.7, y: h * 0.6, r: w * 0.35, color: [20, 60, 140] },
      { x: w * 0.5, y: h * 0.3, r: w * 0.3, color: [120, 30, 80] },
    ];

    for (const c of colors) {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      grad.addColorStop(0, `rgba(${c.color[0]},${c.color[1]},${c.color[2]},0.15)`);
      grad.addColorStop(0.5, `rgba(${c.color[0]},${c.color[1]},${c.color[2]},0.05)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  resize(w: number, h: number): void {
    this.offscreen.width = w;
    this.offscreen.height = h;
    this.generate(w, h);
  }

  update(dt: number): void {
    this.rotation += dt * 0.00002;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.offscreen, -w / 2, -h / 2);
    ctx.restore();
  }
}
