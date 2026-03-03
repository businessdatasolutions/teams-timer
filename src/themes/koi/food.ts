import { ParticlePool } from '../../utils/particles';
import { lerp } from '../../utils/math';

export interface FoodTarget {
  x: number;
  y: number;
  strength: number;
}

export class FoodSystem {
  private pellets = new ParticlePool(60);
  private tinX = 0;
  private tinY = 0;
  private rawX = 0;
  private rawY = 0;
  private tinVisible = false;
  private dispensing = false;
  private lastDispenseTime = 0;
  private touchActive = false;
  private touchStartTime = 0;

  setPointerPosition(x: number, y: number): void {
    this.rawX = x;
    this.rawY = y;
  }

  setPointerVisible(visible: boolean): void {
    this.tinVisible = visible;
    if (!visible) {
      this.dispensing = false;
      this.touchActive = false;
    }
  }

  setDispensing(active: boolean): void {
    this.dispensing = active;
  }

  setTouchStart(): void {
    this.touchActive = true;
    this.touchStartTime = performance.now();
  }

  get isTouchDispensing(): boolean {
    return this.touchActive && (performance.now() - this.touchStartTime) > 300;
  }

  update(dt: number, time: number): FoodTarget[] {
    // Smooth tin tracking
    this.tinX = lerp(this.tinX, this.rawX, 0.12);
    this.tinY = lerp(this.tinY, this.rawY, 0.12);

    // Dispense pellets
    const shouldDispense = this.dispensing || this.isTouchDispensing;
    if (shouldDispense && this.tinVisible && time - this.lastDispenseTime > 150) {
      this.lastDispenseTime = time;
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        this.pellets.emit({
          x: this.tinX + (Math.random() - 0.5) * 16,
          y: this.tinY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 0.2,
          vy: 0.05 + Math.random() * 0.1,
          life: 4000,
          maxLife: 4000,
          size: 2.5 + Math.random() * 1.5,
        });
      }
    }

    // Update pellets
    this.pellets.update(dt, (p, dt) => {
      const s = dt / 16.67;
      p.x += p.vx * s;
      p.y += p.vy * s;
      p.vx *= 0.998;
      p.vy *= 0.998;
      p.life -= dt;
      return p.life > 0;
    });

    // Compute food target centroid
    let cx = 0, cy = 0, count = 0;
    this.pellets.forEach(p => {
      cx += p.x;
      cy += p.y;
      count++;
    });

    if (count === 0) return [];
    return [{ x: cx / count, y: cy / count, strength: count }];
  }

  consumeNear(fishX: number, fishY: number, dt: number): void {
    this.pellets.forEach(p => {
      const dx = p.x - fishX;
      const dy = p.y - fishY;
      if (dx * dx + dy * dy < 900) { // 30px radius
        p.life -= dt * 2; // 3x total decay (1x normal + 2x extra)
      }
    });
  }

  renderPellets(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.pellets.forEach(p => {
      const lifeRatio = Math.max(0, p.life / p.maxLife);
      const radius = p.size * lifeRatio;
      if (radius < 0.5) return;
      const alpha = 0.6 + 0.4 * lifeRatio;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196,132,58,${alpha})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,150,${alpha * 0.5})`;
      ctx.fill();
    });
    ctx.restore();
  }

  renderTin(ctx: CanvasRenderingContext2D): void {
    if (!this.tinVisible) return;
    ctx.save();
    ctx.translate(this.tinX, this.tinY);

    // Shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(4, 6, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tin body
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rim highlight
    ctx.strokeStyle = '#BFA044';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner rim
    ctx.strokeStyle = 'rgba(60,40,10,0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#654A0E';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KOI', 0, 1);

    ctx.restore();
  }
}
