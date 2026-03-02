import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';
import { Koi } from './fish';
import { RippleSystem } from './ripples';
import { Caustics } from './caustics';
import { generatePebbles, generateVignette } from './pebbles';

const STONE_CSS = `
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 320px; height: 320px;
  background: #3b4240;
  border-radius: 43% 57% 48% 52% / 54% 44% 56% 46%;
  box-shadow:
    inset 10px 10px 20px rgba(255,255,255,0.05),
    inset -15px -15px 30px rgba(0,0,0,0.6),
    15px 25px 35px rgba(0,0,0,0.4);
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  z-index: 10;
  padding: 2rem; text-align: center;
  font-family: Georgia, serif;
  animation: koi-breathe 8s infinite alternate ease-in-out;
`;

const ETCHED_CSS = `
  color: rgba(255,255,255,0.6);
  text-shadow: -1px -1px 2px rgba(0,0,0,0.8), 1px 1px 2px rgba(255,255,255,0.1);
  letter-spacing: 2px;
`;

class KoiTheme extends BaseTheme {
  private fish: Koi[] = [];
  private ripples = new RippleSystem();
  private caustics = new Caustics();
  private pebbleBg: HTMLCanvasElement | null = null;
  private vignetteBg: HTMLCanvasElement | null = null;
  private stone!: HTMLElement;
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private duskOverlay!: HTMLElement;
  private endMessage!: HTMLElement;
  private time = 0;
  private lastProgress = 0;

  init(config: AppConfig): void {
    this.container.style.backgroundColor = '#2c5c63';

    // Inject keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes koi-breathe {
        0% { border-radius: 43% 57% 48% 52% / 54% 44% 56% 46%; }
        50% { border-radius: 50% 50% 42% 58% / 48% 56% 44% 52%; }
        100% { border-radius: 55% 45% 55% 45% / 45% 55% 45% 55%; }
      }
    `;
    this.container.appendChild(style);

    // Stone overlay
    this.stone = document.createElement('div');
    this.stone.style.cssText = STONE_CSS;

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText = ETCHED_CSS + 'font-size:4.5rem;font-weight:bold;margin-bottom:0.5rem;';

    this.textEl = document.createElement('div');
    this.textEl.style.cssText = ETCHED_CSS + 'font-size:1.5rem;font-style:italic;max-width:90%;word-wrap:break-word;';
    this.textEl.textContent = config.text;

    this.stone.appendChild(this.timerEl);
    this.stone.appendChild(this.textEl);
    this.container.appendChild(this.stone);

    // Dusk overlay
    this.duskOverlay = document.createElement('div');
    this.duskOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(10,20,30,0);z-index:5;pointer-events:none;transition:background 5s ease-in-out;';
    this.container.appendChild(this.duskOverlay);

    // End message
    this.endMessage = document.createElement('div');
    this.endMessage.style.cssText = 'position:absolute;bottom:-50px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.8);font-size:1.2rem;opacity:0;transition:all 2s ease-in-out;z-index:20;text-shadow:0 2px 4px rgba(0,0,0,0.5);font-family:sans-serif;';
    this.endMessage.textContent = 'Time to return';
    this.container.appendChild(this.endMessage);

    // Fish
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.fish = Array.from({ length: config.fish }, () => new Koi(w, h));
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    if (w > 0 && h > 0) {
      this.pebbleBg = generatePebbles(w, h);
      this.vignetteBg = generateVignette(w, h);
    }
  }

  update(dt: number, timerState: TimerState): void {
    this.time += dt;
    this.timerEl.textContent = timerState.formatted;

    const w = this.canvas.width;
    const h = this.canvas.height;

    for (const f of this.fish) {
      f.update(dt, w, h);
      if (Math.random() < 0.004) this.ripples.spawnAt(f.x, f.y);
    }
    if (Math.random() < 0.015) this.ripples.spawnRandom(w, h);
    this.ripples.update(dt);
    this.lastProgress = timerState.progress;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    if (this.pebbleBg) {
      ctx.drawImage(this.pebbleBg, 0, 0);
    } else {
      ctx.fillStyle = '#234448';
      ctx.fillRect(0, 0, w, h);
    }

    // Caustics
    this.caustics.render(ctx, w, h, this.time);

    // Ripples
    this.ripples.render(ctx);

    // Fish shadows then fish
    for (const f of this.fish) f.drawShadow(ctx);
    for (const f of this.fish) f.draw(ctx);

    // Vignette
    if (this.vignetteBg) ctx.drawImage(this.vignetteBg, 0, 0);

    // Color grading — warm gold → cool blue
    const p = this.lastProgress;
    if (p < 1) {
      const r = Math.round(255 + (60 - 255) * p);
      const g = Math.round(200 + (80 - 200) * p);
      const b = Math.round(120 + (140 - 120) * p);
      const alpha = 0.04 + p * 0.08;
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  onComplete(): void {
    this.duskOverlay.style.background = 'rgba(10,20,30,0.6)';
    this.endMessage.style.bottom = '40px';
    this.endMessage.style.opacity = '1';
  }

  dispose(): void {
    this.stone.remove();
    this.duskOverlay.remove();
    this.endMessage.remove();
    super.dispose();
  }
}

export default KoiTheme;
