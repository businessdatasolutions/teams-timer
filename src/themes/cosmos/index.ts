import { BaseTheme } from '../../base-theme';
import { AppConfig, TimerState } from '../../types';
import { StardustField } from './stardust';
import { Nebula } from './nebula';
import { ShootingStarSystem } from './shooting-stars';
import { UniverseConfig, randomUniverse } from './universes';

type WarpState = 'idle' | 'warping' | 'flash' | 'arriving';

class CosmosTheme extends BaseTheme {
  private stardust!: StardustField;
  private nebula!: Nebula;
  private cosmicObjects = new ShootingStarSystem();
  private timerEl!: HTMLElement;
  private textEl!: HTMLElement;
  private locationEl!: HTMLElement;
  private coordsEl!: HTMLElement;
  private flashEl!: HTMLElement;
  private ringEl!: HTMLCanvasElement;
  private ringCtx!: CanvasRenderingContext2D;
  private lastProgress = 0;

  // Warp state machine
  private warpState: WarpState = 'idle';
  private warpTimer = 0;
  private warpCooldown = 0;
  private currentUniverse!: UniverseConfig;

  private warpInterval = 20_000; // default 20s, configurable via ?warp=
  private static WARP_DURATION = 2500;   // 2.5s acceleration
  private static FLASH_DURATION = 150;   // 150ms white flash
  private static ARRIVE_DURATION = 2000; // 2s deceleration

  init(config: AppConfig): void {
    this.warpInterval = config.warp * 1000;
    this.container.style.background = '#000';

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.stardust = new StardustField(3000, w, h);
    this.nebula = new Nebula(w, h);

    // Pick initial universe
    this.currentUniverse = randomUniverse();
    this.applyUniverse(w, h);

    // HUD border overlay
    const hud = document.createElement('div');
    hud.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;' +
      'box-sizing:border-box;z-index:4;' +
      'background:radial-gradient(circle at center,transparent 30%,rgba(0,40,80,0.2) 100%);' +
      'border:1px solid rgba(0,242,255,0.1);' +
      'box-shadow:inset 0 0 100px rgba(0,242,255,0.04);';
    this.container.appendChild(hud);

    // Flash overlay for warp arrival
    this.flashEl = document.createElement('div');
    this.flashEl.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;background:#fff;' +
      'opacity:0;pointer-events:none;z-index:100;transition:none;';
    this.container.appendChild(this.flashEl);

    // Progress ring canvas
    this.ringEl = document.createElement('canvas');
    this.ringEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;pointer-events:none;';
    this.container.appendChild(this.ringEl);
    this.ringCtx = this.ringEl.getContext('2d')!;

    // Timer overlay
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;';

    this.locationEl = document.createElement('div');
    this.locationEl.style.cssText =
      'font-size:1.8rem;font-weight:700;color:#00f2ff;' +
      'text-shadow:0 0 15px rgba(0,242,255,0.6);' +
      "font-family:'Orbitron',system-ui,sans-serif;letter-spacing:8px;margin-bottom:1rem;" +
      'transition:opacity 0.5s;';

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText =
      'font-size:5rem;font-weight:200;color:#00f2ff;' +
      'text-shadow:0 0 40px rgba(0,242,255,0.6),0 0 80px rgba(0,242,255,0.3);' +
      "font-family:'Orbitron',system-ui,sans-serif;letter-spacing:8px;";

    this.textEl = document.createElement('div');
    this.textEl.style.cssText =
      'font-size:1.3rem;color:rgba(0,242,255,0.7);' +
      'text-shadow:0 0 20px rgba(0,242,255,0.4);' +
      "font-family:'Orbitron',system-ui,sans-serif;margin-top:0.5rem;letter-spacing:4px;text-transform:uppercase;";
    this.textEl.textContent = config.text;

    this.coordsEl = document.createElement('div');
    this.coordsEl.style.cssText =
      'font-size:0.7rem;color:rgba(0,242,255,0.4);font-family:monospace;margin-top:8px;letter-spacing:2px;' +
      'transition:opacity 0.5s;';

    overlay.appendChild(this.locationEl);
    overlay.appendChild(this.timerEl);
    overlay.appendChild(this.textEl);
    overlay.appendChild(this.coordsEl);
    this.container.appendChild(overlay);

    // Load Orbitron font
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
    document.head.appendChild(link);

    // Show initial universe info
    this.updateLocationHUD();
    this.warpCooldown = this.warpInterval;
  }

  private applyUniverse(w: number, h: number): void {
    this.nebula.setColor(this.currentUniverse.color);
    this.cosmicObjects.generate(this.currentUniverse, w, h);
  }

  private updateLocationHUD(): void {
    this.locationEl.textContent = this.currentUniverse.name;
    this.coordsEl.textContent =
      `SECTOR: ${Math.floor(Math.random() * 999)} // ${Math.floor(Math.random() * 999)} // ${this.currentUniverse.type.toUpperCase()}`;
  }

  private startWarp(): void {
    if (this.warpState !== 'idle') return;
    this.warpState = 'warping';
    this.warpTimer = 0;
    // Fade out location text
    this.locationEl.style.opacity = '0';
    this.coordsEl.style.opacity = '0';
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

    // Warp state machine
    this.updateWarp(dt, w, h);

    // Auto-warp every 30 seconds
    if (this.warpState === 'idle' && !timerState.isComplete) {
      this.warpCooldown -= dt;
      if (this.warpCooldown <= 0) {
        this.startWarp();
        this.warpCooldown = this.warpInterval;
      }
    }

    this.stardust.update(dt, w, h);
    this.nebula.update(dt);
    this.cosmicObjects.update(dt, w, h);
  }

  private updateWarp(dt: number, w: number, h: number): void {
    this.warpTimer += dt;

    switch (this.warpState) {
      case 'idle':
        // Gently lerp warp factor toward 0
        this.stardust.warpFactor += (0 - this.stardust.warpFactor) * 0.03;
        // Lerp cosmic objects scale toward 1
        this.cosmicObjects.scale += (1 - this.cosmicObjects.scale) * 0.04;
        break;

      case 'warping': {
        // Ramp warp factor up over WARP_DURATION
        const wp = Math.min(this.warpTimer / CosmosTheme.WARP_DURATION, 1);
        this.stardust.warpFactor = wp;
        // Shrink cosmic objects
        this.cosmicObjects.scale = Math.max(0, 1 - wp);

        if (this.warpTimer >= CosmosTheme.WARP_DURATION) {
          this.warpState = 'flash';
          this.warpTimer = 0;
          // Trigger flash
          this.flashEl.style.transition = 'none';
          this.flashEl.style.opacity = '1';
          // Switch universe
          this.currentUniverse = randomUniverse(this.currentUniverse);
          this.applyUniverse(w, h);
          this.updateLocationHUD();
        }
        break;
      }

      case 'flash':
        if (this.warpTimer >= CosmosTheme.FLASH_DURATION) {
          this.warpState = 'arriving';
          this.warpTimer = 0;
          // Begin flash fade-out
          this.flashEl.style.transition = 'opacity 2s ease-out';
          this.flashEl.style.opacity = '0';
          // Fade in location text
          this.locationEl.style.opacity = '1';
          this.coordsEl.style.opacity = '1';
        }
        break;

      case 'arriving': {
        // Decelerate over ARRIVE_DURATION
        const ap = Math.min(this.warpTimer / CosmosTheme.ARRIVE_DURATION, 1);
        this.stardust.warpFactor = 1 - ap;
        this.cosmicObjects.scale = ap;

        if (this.warpTimer >= CosmosTheme.ARRIVE_DURATION) {
          this.warpState = 'idle';
          this.warpTimer = 0;
        }
        break;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    this.nebula.render(ctx, w, h);
    this.cosmicObjects.render(ctx);
    this.stardust.render(ctx);

    // Progress ring
    this.ringCtx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.2;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + this.lastProgress * Math.PI * 2;

    // Track ring (dim)
    this.ringCtx.beginPath();
    this.ringCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ringCtx.strokeStyle = 'rgba(0,242,255,0.08)';
    this.ringCtx.lineWidth = 2;
    this.ringCtx.stroke();

    // Progress arc
    this.ringCtx.beginPath();
    this.ringCtx.arc(cx, cy, radius, startAngle, endAngle);
    this.ringCtx.strokeStyle = 'rgba(0,242,255,0.5)';
    this.ringCtx.lineWidth = 2;
    this.ringCtx.shadowColor = 'rgba(0,242,255,0.7)';
    this.ringCtx.shadowBlur = 18;
    this.ringCtx.stroke();
    this.ringCtx.shadowBlur = 0;
  }

  onComplete(): void {
    this.startWarp();
  }

  dispose(): void {
    this.ringEl.remove();
    this.flashEl.remove();
    super.dispose();
  }
}

export default CosmosTheme;
