export class Ripple {
  x: number;
  y: number;
  radius = 0;
  maxRadius: number;
  opacity: number;
  speed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.maxRadius = 30 + Math.random() * 50;
    this.opacity = 0.5 + Math.random() * 0.3;
    this.speed = 0.2 + Math.random() * 0.3;
  }

  update(dt: number): boolean {
    this.radius += this.speed * (dt / 16.67);
    this.opacity -= (this.speed / this.maxRadius) * (dt / 16.67);
    return this.opacity > 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${this.opacity * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const inner = this.radius - this.maxRadius * 0.25;
    if (inner > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, inner, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${this.opacity * 0.35})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }
}

export class RippleSystem {
  private ripples: Ripple[] = [];

  spawnRandom(w: number, h: number): void {
    this.ripples.push(new Ripple(Math.random() * w, Math.random() * h));
  }

  spawnAt(x: number, y: number): void {
    this.ripples.push(new Ripple(x, y));
  }

  update(dt: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      if (!this.ripples[i].update(dt)) {
        this.ripples.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const r of this.ripples) {
      r.render(ctx);
    }
  }
}
