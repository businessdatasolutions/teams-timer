import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';
import { createBlobContainer } from './blobs';
import { lerp } from '../../utils/math';

// Warm palette (start) → cool palette (end)
const WARM = [
  [255, 69, 0],    // orange-red
  [255, 140, 0],   // dark orange
  [255, 200, 50],  // amber
];
const COOL = [
  [100, 50, 200],  // purple
  [60, 80, 220],   // blue
  [120, 60, 180],  // violet
];

class LavaTheme extends BaseTheme {
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private wrapper!: HTMLElement;
  private blobs: HTMLElement[] = [];

  init(config: AppConfig): void {
    // Hide canvas — lava is CSS-only
    this.canvas.style.display = 'none';

    this.container.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#1a0a2e;';

    // CSS custom properties for initial colors
    this.container.style.setProperty('--lava-bg', '#1a0a2e');
    for (let i = 0; i < 3; i++) {
      this.container.style.setProperty(`--lava-color-${i}`, `rgb(${WARM[i].join(',')})`);
    }

    const { wrapper, blobs } = createBlobContainer(this.container);
    this.wrapper = wrapper;
    this.blobs = blobs;

    // Timer overlay with blend mode
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;';

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText = 'font-size:6rem;font-weight:900;color:#fff;mix-blend-mode:difference;font-family:system-ui,sans-serif;letter-spacing:4px;';

    this.textEl = document.createElement('div');
    this.textEl.style.cssText = 'font-size:1.5rem;font-weight:700;color:#fff;mix-blend-mode:difference;font-family:system-ui,sans-serif;margin-top:0.5rem;';
    this.textEl.textContent = config.text;

    overlay.appendChild(this.timerEl);
    overlay.appendChild(this.textEl);
    this.container.appendChild(overlay);
  }

  resize(_w: number, _h: number): void {
    // CSS handles layout; no canvas resize needed
  }

  update(_dt: number, timerState: TimerState): void {
    this.timerEl.textContent = timerState.formatted;

    // Shift palette warm → cool
    const p = timerState.progress;
    for (let i = 0; i < 3; i++) {
      const r = Math.round(lerp(WARM[i][0], COOL[i][0], p));
      const g = Math.round(lerp(WARM[i][1], COOL[i][1], p));
      const b = Math.round(lerp(WARM[i][2], COOL[i][2], p));
      this.container.style.setProperty(`--lava-color-${i}`, `rgb(${r},${g},${b})`);
    }
  }

  render(): void {
    // No-op: CSS-driven theme
  }

  onComplete(): void {
    // Slow down and settle blobs
    for (const blob of this.blobs) {
      blob.style.animationPlayState = 'paused';
      blob.style.transition = 'transform 3s ease-out';
      blob.style.transform = 'translateY(30vh) scale(0.8)';
    }
  }

  dispose(): void {
    this.wrapper.remove();
    super.dispose();
  }
}

export default LavaTheme;
