import { AppConfig, TimerState } from './types';

export abstract class BaseTheme {
  protected container: HTMLElement;
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  abstract init(config: AppConfig): void;
  abstract resize(w: number, h: number): void;
  abstract update(dt: number, timerState: TimerState): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract onComplete(): void;

  dispose(): void {
    this.canvas.remove();
  }
}

export type ThemeConstructor = new (container: HTMLElement) => BaseTheme;
