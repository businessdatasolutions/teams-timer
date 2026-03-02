// Rare shooting stars during the twilight phase (progress > 0.66)

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

export class ForestShootingStars {
  private stars: ShootingStar[] = [];
  private cooldown = 0;

  update(dt: number, w: number, h: number, progress: number): void {
    // Only active during twilight
    if (progress < 0.66) return;

    const scale = dt / 16.67;

    this.cooldown -= dt;
    if (this.cooldown <= 0) {
      this.cooldown = 15000 + Math.random() * 25000; // 15–40s
      const angle = -Math.PI / 6 + Math.random() * -Math.PI / 4;
      const speed = 6 + Math.random() * 4; // slightly slower than cosmos
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.25,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        life: 0,
        maxLife: 30 + Math.random() * 20, // shorter trails
        length: 40 + Math.random() * 50,
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
      const alpha = (1 - s.life / s.maxLife) * 0.7; // dimmer than cosmos
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      const tailX = s.x - (s.vx / speed) * s.length;
      const tailY = s.y + (s.vy / speed) * s.length;

      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(220,230,255,${alpha})`);
      grad.addColorStop(1, 'rgba(220,230,255,0)');

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}
