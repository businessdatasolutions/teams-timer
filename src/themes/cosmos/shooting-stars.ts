interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

export class ShootingStarSystem {
  private stars: ShootingStar[] = [];
  private cooldown = 0;

  update(dt: number, w: number, h: number): void {
    const scale = dt / 16.67;

    // Random spawn every 10–30s
    this.cooldown -= dt;
    if (this.cooldown <= 0) {
      this.cooldown = 10000 + Math.random() * 20000;
      const angle = -Math.PI / 6 + Math.random() * -Math.PI / 4;
      const speed = 8 + Math.random() * 6;
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.3,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        length: 60 + Math.random() * 80,
      });
    }

    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      s.x += s.vx * scale;
      s.y -= s.vy * scale;
      s.life += scale;
      if (s.life > s.maxLife || s.x < -100 || s.x > w + 100 || s.y < -100 || s.y > h + 100) {
        this.stars.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const s of this.stars) {
      const alpha = 1 - s.life / s.maxLife;
      const tailX = s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length;
      const tailY = s.y + (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length;

      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
