// Falling leaves that drift down in lazy spirals

import { SimplexNoise } from '../../utils/noise';

interface Leaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  shape: number; // 0=oval, 1=maple, 2=elongated
  life: number;
  maxLife: number;
  opacity: number;
}

export class LeafSystem {
  private leaves: Leaf[] = [];
  private noise = new SimplexNoise(99);
  private time = 0;
  private spawnTimer = 0;
  private maxLeaves = 30;

  update(dt: number, w: number, h: number): void {
    this.time += dt * 0.001;
    const scale = dt / 16.67;

    // Spawn new leaves periodically
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.leaves.length < this.maxLeaves) {
      this.spawnTimer = 3000 + Math.random() * 5000; // 3–8 seconds
      this.leaves.push({
        x: Math.random() * w,
        y: h * (0.15 + Math.random() * 0.15), // near tree tops
        vx: 0,
        vy: 0,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        size: 4 + Math.random() * 6,
        shape: Math.floor(Math.random() * 3),
        life: 0,
        maxLife: 8000 + Math.random() * 6000, // 8–14 seconds
        opacity: 1,
      });
    }

    // Update existing leaves
    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const l = this.leaves[i];
      l.life += dt;

      // Gravity
      l.vy += 0.02 * scale;

      // Noise-driven lateral drift for spiral motion
      const nx = this.noise.noise2D(l.y * 0.01 + this.time * 0.5, l.x * 0.005);
      l.vx += nx * 0.15 * scale;

      // Friction
      l.vx *= 0.98;
      l.vy *= 0.99; // Less horizontal friction than vertical = floaty feel

      l.x += l.vx * scale;
      l.y += l.vy * scale;
      l.rotation += l.rotSpeed * scale;

      // Fade out near end of life
      if (l.life > l.maxLife * 0.7) {
        l.opacity = 1 - (l.life - l.maxLife * 0.7) / (l.maxLife * 0.3);
      }

      // Remove dead or off-screen leaves
      if (l.life > l.maxLife || l.y > h + 20 || l.x < -40 || l.x > w + 40) {
        this.leaves.splice(i, 1);
      }
    }
  }

  applyWindGust(strength: number): void {
    for (const l of this.leaves) {
      l.vx += (0.5 + Math.random() * 0.5) * strength;
      l.vy -= Math.random() * Math.abs(strength) * 0.3;
      l.rotSpeed += (Math.random() - 0.5) * 0.1;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const l of this.leaves) {
      if (l.opacity < 0.01) continue;

      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      ctx.globalAlpha = l.opacity;

      ctx.fillStyle = '#1a3010';
      ctx.beginPath();

      if (l.shape === 0) {
        // Oval leaf
        ctx.ellipse(0, 0, l.size * 0.4, l.size, 0, 0, Math.PI * 2);
      } else if (l.shape === 1) {
        // Maple-like leaf (simplified)
        const s = l.size;
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.4, -s * 0.3);
        ctx.lineTo(s * 0.8, -s * 0.5);
        ctx.lineTo(s * 0.4, 0);
        ctx.lineTo(s * 0.5, s * 0.6);
        ctx.lineTo(0, s * 0.3);
        ctx.lineTo(-s * 0.5, s * 0.6);
        ctx.lineTo(-s * 0.4, 0);
        ctx.lineTo(-s * 0.8, -s * 0.5);
        ctx.lineTo(-s * 0.4, -s * 0.3);
        ctx.closePath();
      } else {
        // Elongated leaf
        ctx.ellipse(0, 0, l.size * 0.25, l.size * 1.2, 0, 0, Math.PI * 2);
      }

      ctx.fill();

      // Stem line
      ctx.strokeStyle = '#0d1a08';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -l.size * 0.8);
      ctx.lineTo(0, l.size * 0.8);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}
