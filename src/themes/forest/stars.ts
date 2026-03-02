// Star field that emerges as the sky darkens

interface Star {
  x: number;
  y: number;
  size: number;
  twinklePhase: number;
  fadeInThreshold: number; // progress value at which this star appears
  alpha: number;
}

export class StarField {
  private stars: Star[] = [];
  private time = 0;

  constructor(count: number, w: number, h: number) {
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.4, // upper 40% of screen
        size: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        fadeInThreshold: 0.3 + Math.random() * 0.7, // appear between 30%–100% progress
        alpha: 0,
      });
    }
  }

  update(dt: number, progress: number): void {
    this.time += dt * 0.001;
    for (const s of this.stars) {
      // Fade in when progress exceeds threshold
      const target = progress >= s.fadeInThreshold ? 1 : 0;
      s.alpha += (target - s.alpha) * 0.02 * (dt / 16.67);

      // Twinkle
      if (s.alpha > 0.01) {
        s.alpha *= 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(this.time * 1.5 + s.twinklePhase));
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const s of this.stars) {
      if (s.alpha < 0.01) continue;

      // Glow
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
      grad.addColorStop(0, `rgba(220,230,255,${s.alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(220,230,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
