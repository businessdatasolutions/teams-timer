import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';
import { SandGrid } from './automata';
import { SandEmitter } from './emitter';

class SandTheme extends BaseTheme {
  private grid!: SandGrid;
  private emitter!: SandEmitter;
  private imageData!: ImageData;
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private stepAccumulator = 0;

  init(config: AppConfig): void {
    this.container.style.background = '#1a1a1a';

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.grid = new SandGrid(w, h, 2);

    // Stamp text as obstacle
    this.stampTextObstacle(config.text, w, h);

    // Calculate total grains: fill ~30% of the bottom half
    const totalGrains = Math.floor(this.grid.cols * this.grid.rows * 0.15);
    this.emitter = new SandEmitter(totalGrains, config.totalSeconds, this.grid.cols);

    // Timer overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;';

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText = 'font-size:5rem;font-weight:200;color:rgba(220,195,140,0.9);text-shadow:0 2px 4px rgba(0,0,0,0.5);font-family:Georgia,serif;letter-spacing:4px;';

    this.textEl = document.createElement('div');
    this.textEl.style.cssText = 'font-size:1.3rem;color:rgba(220,195,140,0.6);font-family:Georgia,serif;margin-top:0.5rem;';
    this.textEl.textContent = config.text;

    overlay.appendChild(this.timerEl);
    overlay.appendChild(this.textEl);
    this.container.appendChild(overlay);
  }

  private stampTextObstacle(text: string, w: number, h: number): void {
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d')!;
    ctx.font = 'bold 80px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(text, w / 2, h / 2);

    // Sample pixels and create collision mask
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const px = col * this.grid.cellSize;
        const py = row * this.grid.cellSize;
        const i = (py * w + px) * 4;
        if (data[i + 3] > 128) {
          this.grid.setObstacle(col, row);
        }
      }
    }
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.imageData = this.ctx.createImageData(w, h);
  }

  update(dt: number, timerState: TimerState): void {
    this.timerEl.textContent = timerState.formatted;

    if (!timerState.isComplete) {
      this.emitter.update(dt, this.grid);
    }

    // Step simulation at ~60hz
    this.stepAccumulator += dt;
    while (this.stepAccumulator >= 16) {
      this.stepAccumulator -= 16;
      this.grid.step();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas.width;

    // Clear to background
    const data = this.imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 26;     // #1a
      data[i + 1] = 26;
      data[i + 2] = 26;
      data[i + 3] = 255;
    }

    this.grid.renderToImageData(this.imageData);
    ctx.putImageData(this.imageData, 0, 0);

    // Subtle top gradient (sand source area)
    const grad = ctx.createLinearGradient(w / 2, 0, w / 2, 40);
    grad.addColorStop(0, 'rgba(220,195,140,0.15)');
    grad.addColorStop(1, 'rgba(220,195,140,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(w / 2 - 30, 0, 60, 40);
  }

  onComplete(): void {
    // Sand has settled — nothing additional needed
  }
}

export default SandTheme;
