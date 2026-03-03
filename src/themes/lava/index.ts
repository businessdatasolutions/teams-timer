import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';
import { WaxSimulation, ScreenBounds } from './blobs';
import { SimplexNoise } from '../../utils/noise';
import { lerp } from '../../utils/math';

type RGB = [number, number, number];

const BLOB_COUNT = 12;
const HUE_OFFSETS = [0, 40, 80];
const HUE_CYCLE_SPEED = 0.015;

function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

class LavaTheme extends BaseTheme {
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private overlay!: HTMLElement;
  private sim!: WaxSimulation;
  private bounds!: ScreenBounds;
  private glowIntensity = 1;
  private progress = 0;
  private completed = false;
  private time = 0;
  private currentColors: RGB[] = [[255, 69, 0], [255, 140, 0], [255, 200, 50]];
  private glowColor: RGB = [255, 80, 20];
  private liquidColor: RGB = [40, 15, 5];

  init(config: AppConfig): void {
    this.container.style.cssText =
      'position:relative;width:100%;height:100%;overflow:hidden;background:#000;';

    this.canvas.style.display = '';
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;

    this.bounds = { width: this.canvas.width, height: this.canvas.height };

    const noise = new SimplexNoise(42);
    this.sim = new WaxSimulation(noise);
    this.sim.init(this.bounds, BLOB_COUNT);
    this.computeColors();
    this.sim.setColors(this.currentColors, this.liquidColor);

    // Timer overlay — centered
    this.overlay = document.createElement('div');
    this.overlay.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;';

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText =
      'font-size:6rem;font-weight:900;color:#fff;font-family:system-ui,sans-serif;letter-spacing:4px;' +
      'mix-blend-mode:difference;';

    this.textEl = document.createElement('div');
    this.textEl.style.cssText =
      'font-size:1.5rem;font-weight:700;color:#fff;font-family:system-ui,sans-serif;' +
      'margin-top:0.5rem;mix-blend-mode:difference;';
    this.textEl.textContent = config.text;

    this.overlay.appendChild(this.timerEl);
    this.overlay.appendChild(this.textEl);
    this.container.appendChild(this.overlay);
  }

  private computeColors(): void {
    const hueBase = (this.time * HUE_CYCLE_SPEED) % 360;
    const sat = lerp(100, 70, this.progress);
    const light = lerp(55, 40, this.progress);

    this.currentColors = HUE_OFFSETS.map(offset =>
      hslToRgb(hueBase + offset, sat, light)
    );

    this.glowColor = [
      Math.round((this.currentColors[0][0] + this.currentColors[1][0] + this.currentColors[2][0]) / 3),
      Math.round((this.currentColors[0][1] + this.currentColors[1][1] + this.currentColors[2][1]) / 3),
      Math.round((this.currentColors[0][2] + this.currentColors[1][2] + this.currentColors[2][2]) / 3),
    ];

    this.liquidColor = hslToRgb(hueBase + 20, lerp(40, 20, this.progress), lerp(12, 8, this.progress));
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.bounds = { width: w, height: h };
    this.sim.init(this.bounds, BLOB_COUNT);
    this.computeColors();
    this.sim.setColors(this.currentColors, this.liquidColor);
  }

  update(dt: number, timerState: TimerState): void {
    this.timerEl.textContent = timerState.formatted;
    this.progress = timerState.progress;
    this.time += dt;

    this.computeColors();
    this.sim.setColors(this.currentColors, this.liquidColor);
    this.sim.update(dt, this.bounds);

    if (this.completed) {
      this.glowIntensity = Math.max(0.15, this.glowIntensity - dt * 0.0003);
    } else {
      this.glowIntensity = lerp(1, 0.5, this.progress);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Liquid background fill
    const lc = this.liquidColor;
    ctx.fillStyle = `rgb(${lc[0]},${lc[1]},${lc[2]})`;
    ctx.fillRect(0, 0, w, h);

    // Bottom glow (heat source)
    const gc = this.glowColor;
    const bottomGlow = ctx.createRadialGradient(
      w / 2, h, 0,
      w / 2, h, h * 0.7,
    );
    bottomGlow.addColorStop(0, `rgba(${gc[0]},${gc[1]},${gc[2]},${this.glowIntensity * 0.25})`);
    bottomGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, w, h);

    // Metaball wax blobs
    this.sim.render(ctx, this.bounds);

    // Glass edge vignette
    this.drawVignette(ctx, w, h);
  }

  private drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Oval vignette — darkens edges to simulate looking through glass
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.55;
    const ry = h * 0.55;

    ctx.translate(cx, cy);
    ctx.scale(rx / ry, 1);

    const vig = ctx.createRadialGradient(0, 0, ry * 0.6, 0, 0, ry);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.7, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(-ry, -ry, ry * 2, ry * 2);

    ctx.restore();
  }

  onComplete(): void {
    this.completed = true;
    this.sim.settle();
  }

  dispose(): void {
    this.overlay.remove();
    super.dispose();
  }
}

export default LavaTheme;
