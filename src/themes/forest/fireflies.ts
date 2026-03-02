import { SimplexNoise } from '../../utils/noise';

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  brightness: number;
  size: number;
}

export class FireflySystem {
  private flies: Firefly[] = [];
  private noise = new SimplexNoise(42);
  private time = 0;

  constructor(count: number, w: number, h: number) {
    for (let i = 0; i < count; i++) {
      this.flies.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.7, // Keep in upper portion
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2,
        brightness: 0.3 + Math.random() * 0.7,
        size: 2 + Math.random() * 3,
      });
    }
  }

  update(dt: number, w: number, h: number, mouseX: number, mouseY: number): void {
    this.time += dt * 0.001;
    const scale = dt / 16.67;

    for (let i = 0; i < this.flies.length; i++) {
      const f = this.flies[i];
      // Noise-perturbed velocity for smooth wandering
      const nx = this.noise.noise2D(f.x * 0.005 + this.time, f.y * 0.005);
      const ny = this.noise.noise2D(f.x * 0.005, f.y * 0.005 + this.time);
      f.vx += nx * 0.3;
      f.vy += ny * 0.3;

      // Cursor attraction (gentle gravitational pull within 150px)
      if (mouseX >= 0 && mouseY >= 0) {
        const dx = mouseX - f.x;
        const dy = mouseY - f.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 150 * 150 && distSq > 1) {
          f.vx += dx * 0.001 * scale;
          f.vy += dy * 0.001 * scale;
        }
      }

      f.vx *= 0.95;
      f.vy *= 0.95;

      f.x += f.vx * scale;
      f.y += f.vy * scale;

      // Wrap around
      if (f.x < -20) f.x = w + 20;
      if (f.x > w + 20) f.x = -20;
      if (f.y < -20) f.y = h * 0.8;
      if (f.y > h * 0.8) f.y = -20;

      // Pulse brightness
      f.brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.time * 2 + f.phase));
    }

    // Firefly sync: nearby pairs nudge phases toward each other
    for (let i = 0; i < this.flies.length; i++) {
      for (let j = i + 1; j < this.flies.length; j++) {
        const a = this.flies[i];
        const b = this.flies[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy < 80 * 80) {
          const nudge = 0.02 * scale;
          const diff = b.phase - a.phase;
          a.phase += diff * nudge;
          b.phase -= diff * nudge;
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const f of this.flies) {
      const alpha = f.brightness * 0.9;
      // Glow
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 4);
      grad.addColorStop(0, `rgba(255,255,150,${alpha})`);
      grad.addColorStop(0.3, `rgba(255,255,100,${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(255,255,100,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(255,255,200,${alpha})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  convergeToCenter(w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    for (const f of this.flies) {
      f.vx += (cx - f.x) * 0.01;
      f.vy += (cy - f.y) * 0.01;
    }
  }

  scatter(): void {
    for (const f of this.flies) {
      f.vx += (Math.random() - 0.3) * 8; // biased rightward for wind feel
      f.vy += (Math.random() - 0.5) * 4;
    }
  }
}
