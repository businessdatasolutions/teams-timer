import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';
import { createTreeLayer, injectSwayKeyframes, setParallaxOffset, triggerWindGust, LAYER_CONFIG } from './trees';
import { FireflySystem } from './fireflies';
import { StarField } from './stars';
import { FogSystem } from './fog';
import { Moon } from './moon';
import { LeafSystem } from './leaves';
import { ForestShootingStars } from './shooting-stars';
import { GodRays } from './god-rays';
import { WildlifeSystem } from './wildlife';
import { BreathingGlow } from './breathing';
import { lerp } from '../../utils/math';

// Sky gradient colors: afternoon → twilight
const SKY_START = { r1: 255, g1: 160, b1: 70, r2: 100, g2: 140, b2: 200 };
const SKY_END = { r1: 60, g1: 30, b1: 80, r2: 20, g2: 15, b2: 60 };

class ForestTheme extends BaseTheme {
  // Core systems
  private fireflies!: FireflySystem;
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private skyEl!: HTMLElement;
  private completing = false;

  // Sky canvas (behind trees, z-index 1)
  private skyCanvas!: HTMLCanvasElement;
  private skyCtx!: CanvasRenderingContext2D;

  // New systems
  private stars!: StarField;
  private fog!: FogSystem;
  private moon!: Moon;
  private leaves!: LeafSystem;
  private shootingStars!: ForestShootingStars;
  private godRays!: GodRays;
  private wildlife!: WildlifeSystem;
  private breathingGlow!: BreathingGlow;

  // Interaction state
  private mouseX = -1;
  private mouseY = -1;
  private currentProgress = 0;

  // Bound event handlers for cleanup
  private onMouseMove = (e: MouseEvent) => { this.mouseX = e.clientX; this.mouseY = e.clientY; };
  private onClick = () => {
    triggerWindGust(this.container);
    this.leaves.applyWindGust(8);
    this.fireflies.scatter();
  };

  init(config: AppConfig): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Sky background
    this.skyEl = document.createElement('div');
    this.skyEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;transition:background 2s;';
    this.updateSky(0);
    this.container.appendChild(this.skyEl);

    // Sky canvas for elements behind trees (moon, stars, god rays, shooting stars)
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;';
    this.skyCanvas.width = w;
    this.skyCanvas.height = h;
    this.skyCtx = this.skyCanvas.getContext('2d')!;
    this.container.appendChild(this.skyCanvas);

    // Main canvas for foreground effects (above trees)
    this.canvas.style.zIndex = '8';

    // Tree layers (5 layers, z-index 2-6)
    injectSwayKeyframes(this.container);
    for (let i = 0; i < LAYER_CONFIG.length; i++) {
      createTreeLayer(this.container, i);
    }

    // Timer text overlay (z-index 10)
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;';

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText = 'font-size:5rem;font-weight:300;color:rgba(255,255,255,0.85);text-shadow:0 0 30px rgba(255,255,255,0.4),0 0 60px rgba(255,255,255,0.2);font-family:Georgia,serif;letter-spacing:4px;';

    this.textEl = document.createElement('div');
    this.textEl.style.cssText = 'font-size:1.5rem;color:rgba(255,255,255,0.7);text-shadow:0 0 20px rgba(255,255,255,0.3);font-family:Georgia,serif;margin-top:0.5rem;font-style:italic;';
    this.textEl.textContent = config.text;

    overlay.appendChild(this.timerEl);
    overlay.appendChild(this.textEl);
    this.container.appendChild(overlay);

    // Initialize all systems
    this.fireflies = new FireflySystem(45, w, h);
    this.stars = new StarField(120, w, h);
    this.fog = new FogSystem();
    this.moon = new Moon(w, h);
    this.leaves = new LeafSystem();
    this.shootingStars = new ForestShootingStars();
    this.godRays = new GodRays();
    this.wildlife = new WildlifeSystem(w, h);
    this.breathingGlow = new BreathingGlow();

    // Event listeners
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('click', this.onClick);
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.skyCanvas.width = w;
    this.skyCanvas.height = h;
  }

  update(dt: number, timerState: TimerState): void {
    const p = timerState.progress;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.timerEl.textContent = timerState.formatted;
    this.updateSky(p);

    // Update all subsystems
    this.stars.update(dt, p);
    this.fog.update(dt, p);
    this.moon.update(dt, p);
    this.leaves.update(dt, w, h);
    this.shootingStars.update(dt, w, h, p);
    this.godRays.update(dt, p);
    this.wildlife.update(dt, w, h, p);
    this.breathingGlow.update(dt);
    this.fireflies.update(dt, w, h, this.mouseX, this.mouseY);

    // Parallax on mouse move
    if (this.mouseX >= 0) {
      setParallaxOffset(this.mouseX, w);
    }

    // Breathing glow on timer text
    const glowIntensity = this.breathingGlow.getGlowIntensity();
    const glowSize = 30 + glowIntensity * 40;
    const glowAlpha = 0.2 + glowIntensity * 0.4;
    this.timerEl.style.textShadow = `0 0 ${glowSize}px rgba(255,255,255,${glowAlpha}), 0 0 ${glowSize * 2}px rgba(255,255,255,${glowAlpha * 0.5})`;

    if (this.completing) {
      this.fireflies.convergeToCenter(w, h);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sky canvas (behind trees, z-index 1)
    const sctx = this.skyCtx;
    sctx.clearRect(0, 0, w, h);
    this.godRays.render(sctx, w, h, this.currentProgress);
    this.stars.render(sctx);
    this.moon.render(sctx, this.currentProgress);
    this.shootingStars.render(sctx);

    // Main canvas (above trees, z-index 8)
    ctx.clearRect(0, 0, w, h);
    this.fog.render(ctx, w, h, this.currentProgress);
    this.wildlife.render(ctx);
    this.leaves.render(ctx);
    this.fireflies.render(ctx);
  }

  onComplete(): void {
    this.completing = true;
  }

  dispose(): void {
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('click', this.onClick);
    this.skyCanvas.remove();
    super.dispose();
  }

  private updateSky(progress: number): void {
    this.currentProgress = progress;
    const r1 = Math.round(lerp(SKY_START.r1, SKY_END.r1, progress));
    const g1 = Math.round(lerp(SKY_START.g1, SKY_END.g1, progress));
    const b1 = Math.round(lerp(SKY_START.b1, SKY_END.b1, progress));
    const r2 = Math.round(lerp(SKY_START.r2, SKY_END.r2, progress));
    const g2 = Math.round(lerp(SKY_START.g2, SKY_END.g2, progress));
    const b2 = Math.round(lerp(SKY_START.b2, SKY_END.b2, progress));
    this.skyEl.style.background = `linear-gradient(to top, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}))`;
  }
}

export default ForestTheme;
