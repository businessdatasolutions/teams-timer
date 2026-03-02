// Bird and deer silhouettes for ambient life

interface Bird {
  x: number;
  y: number;
  vx: number;
  wingPhase: number;
  size: number;
}

interface Deer {
  x: number;
  y: number;
  opacity: number;
  fadeState: 'in' | 'hold' | 'out' | 'done';
  timer: number;
  appearCount: number;
}

export class WildlifeSystem {
  private birds: Bird[] = [];
  private deer: Deer;
  private birdCooldown = 5000 + Math.random() * 10000;
  private deerCooldown = 0;
  private time = 0;

  constructor(w: number, h: number) {
    this.deer = {
      x: w * (0.3 + Math.random() * 0.4),
      y: h * 0.78,
      opacity: 0,
      fadeState: 'done',
      timer: 0,
      appearCount: 0,
    };
  }

  update(dt: number, w: number, h: number, progress: number): void {
    this.time += dt * 0.001;
    const scale = dt / 16.67;

    // === Birds (bright phase only) ===
    if (progress < 0.4) {
      this.birdCooldown -= dt;
      if (this.birdCooldown <= 0) {
        this.birdCooldown = 15000 + Math.random() * 15000;
        const count = 1 + Math.floor(Math.random() * 3);
        const fromLeft = Math.random() > 0.5;
        const baseY = h * (0.08 + Math.random() * 0.2);
        for (let i = 0; i < count; i++) {
          this.birds.push({
            x: fromLeft ? -30 - i * 40 : w + 30 + i * 40,
            y: baseY + (Math.random() - 0.5) * 30,
            vx: (fromLeft ? 1 : -1) * (1.5 + Math.random() * 1),
            wingPhase: Math.random() * Math.PI * 2,
            size: 6 + Math.random() * 4,
          });
        }
      }
    }

    // Update birds
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      b.x += b.vx * scale;
      b.wingPhase += 0.08 * scale;
      if (b.x < -60 || b.x > w + 60) {
        this.birds.splice(i, 1);
      }
    }

    // === Deer (twilight phase, max 2 appearances) ===
    if (progress > 0.6 && this.deer.fadeState === 'done' && this.deer.appearCount < 2) {
      this.deerCooldown -= dt;
      if (this.deerCooldown <= 0) {
        this.deerCooldown = 20000 + Math.random() * 15000;
        this.deer.fadeState = 'in';
        this.deer.timer = 0;
        this.deer.opacity = 0;
        this.deer.x = w * (0.2 + Math.random() * 0.6);
        this.deer.appearCount++;
      }
    }

    if (this.deer.fadeState !== 'done') {
      this.deer.timer += dt * 0.001;
      if (this.deer.fadeState === 'in') {
        this.deer.opacity = Math.min(1, this.deer.timer / 2); // 2s fade in
        if (this.deer.timer >= 2) {
          this.deer.fadeState = 'hold';
          this.deer.timer = 0;
        }
      } else if (this.deer.fadeState === 'hold') {
        this.deer.opacity = 1;
        if (this.deer.timer >= 3) { // 3s hold
          this.deer.fadeState = 'out';
          this.deer.timer = 0;
        }
      } else if (this.deer.fadeState === 'out') {
        this.deer.opacity = Math.max(0, 1 - this.deer.timer / 2); // 2s fade out
        if (this.deer.timer >= 2) {
          this.deer.fadeState = 'done';
          this.deer.opacity = 0;
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render birds
    for (const b of this.birds) {
      const wing = Math.sin(b.wingPhase) * b.size * 0.6;
      ctx.strokeStyle = 'rgba(20,20,30,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Left wing
      ctx.moveTo(b.x - b.size, b.y - wing);
      ctx.quadraticCurveTo(b.x - b.size * 0.4, b.y - wing * 0.3, b.x, b.y);
      // Right wing
      ctx.quadraticCurveTo(b.x + b.size * 0.4, b.y - wing * 0.3, b.x + b.size, b.y - wing);
      ctx.stroke();
    }

    // Render deer
    if (this.deer.opacity > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.deer.opacity * 0.6;
      ctx.fillStyle = '#0a1208';
      ctx.translate(this.deer.x, this.deer.y);

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(30, -18, 8, 10, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.beginPath();
      ctx.moveTo(20, -8);
      ctx.lineTo(26, -14);
      ctx.lineTo(34, -12);
      ctx.lineTo(28, -4);
      ctx.fill();

      // Legs (4)
      ctx.fillRect(-18, 12, 4, 22);
      ctx.fillRect(-8, 12, 4, 20);
      ctx.fillRect(8, 12, 4, 20);
      ctx.fillRect(18, 12, 4, 22);

      // Antlers
      ctx.strokeStyle = '#0a1208';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, -26);
      ctx.lineTo(26, -38);
      ctx.lineTo(22, -34);
      ctx.moveTo(26, -38);
      ctx.lineTo(28, -44);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(34, -26);
      ctx.lineTo(38, -38);
      ctx.lineTo(42, -34);
      ctx.moveTo(38, -38);
      ctx.lineTo(36, -44);
      ctx.stroke();

      // Tail
      ctx.fillStyle = '#0a1208';
      ctx.beginPath();
      ctx.ellipse(-28, -4, 5, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}
