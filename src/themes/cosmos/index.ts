import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';
import { StardustField } from './stardust';
import { Nebula } from './nebula';
import { ShootingStarSystem } from './shooting-stars';

class CosmosTheme extends BaseTheme {
  private stardust!: StardustField;
  private nebula!: Nebula;
  private shootingStars = new ShootingStarSystem();
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private ringEl!: HTMLCanvasElement;
  private ringCtx!: CanvasRenderingContext2D;
  private lastProgress = 0;

  init(config: AppConfig): void {
    this.container.style.background = '#050510';

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.stardust = new StardustField(1200, w, h);
    this.nebula = new Nebula(w, h);

    // Progress ring canvas overlay
    this.ringEl = document.createElement('canvas');
    this.ringEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;pointer-events:none;';
    this.container.appendChild(this.ringEl);
    this.ringCtx = this.ringEl.getContext('2d')!;

    // Timer text
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;';

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText = 'font-size:5rem;font-weight:200;color:rgba(200,210,255,0.9);text-shadow:0 0 40px rgba(100,120,255,0.6),0 0 80px rgba(100,120,255,0.3);font-family:system-ui,sans-serif;letter-spacing:6px;';

    this.textEl = document.createElement('div');
    this.textEl.style.cssText = 'font-size:1.3rem;color:rgba(180,190,255,0.7);text-shadow:0 0 20px rgba(100,120,255,0.4);font-family:system-ui,sans-serif;margin-top:0.5rem;letter-spacing:3px;';
    this.textEl.textContent = config.text;

    overlay.appendChild(this.timerEl);
    overlay.appendChild(this.textEl);
    this.container.appendChild(overlay);
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.ringEl.width = w;
    this.ringEl.height = h;
    this.nebula.resize(w, h);
  }

  update(dt: number, timerState: TimerState): void {
    this.timerEl.textContent = timerState.formatted;
    this.lastProgress = timerState.progress;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.stardust.update(dt, w, h);
    this.nebula.update(dt);
    this.shootingStars.update(dt, w, h);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    this.nebula.render(ctx, w, h);
    this.stardust.render(ctx);
    this.shootingStars.render(ctx);

    // Progress ring
    this.ringCtx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.2;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + this.lastProgress * Math.PI * 2;

    this.ringCtx.beginPath();
    this.ringCtx.arc(cx, cy, radius, startAngle, endAngle);
    this.ringCtx.strokeStyle = 'rgba(100,140,255,0.4)';
    this.ringCtx.lineWidth = 2;
    this.ringCtx.shadowColor = 'rgba(100,140,255,0.6)';
    this.ringCtx.shadowBlur = 15;
    this.ringCtx.stroke();
    this.ringCtx.shadowBlur = 0;
  }

  onComplete(): void {
    this.timerEl.style.textShadow = '0 0 60px rgba(100,200,255,0.9),0 0 120px rgba(100,200,255,0.5)';
  }

  dispose(): void {
    this.ringEl.remove();
    super.dispose();
  }
}

export default CosmosTheme;
