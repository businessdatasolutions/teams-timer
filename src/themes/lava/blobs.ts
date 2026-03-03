import { SimplexNoise } from '../../utils/noise';
import { clamp } from '../../utils/math';

export interface ScreenBounds {
  width: number;
  height: number;
}

interface WaxBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  temperature: number;
  colorIndex: number;
  noiseOffset: number;
}

const HEAT_RATE = 0.0008;
const COOL_RATE = 0.0006;
const BUOYANCY = 0.00018;
const GRAVITY = 0.0001;
const DRAG = 0.984;
const NOISE_SCALE = 0.002;
const NOISE_STRENGTH = 0.00006;
const REPULSION_DIST = 1.8;
const REPULSION_FORCE = 0.0001;

const METABALL_SCALE = 2;
const FIELD_THRESHOLD = 1.0;
const GLOW_THRESHOLD = 0.35;

export class WaxSimulation {
  private blobs: WaxBlob[] = [];
  private noise: SimplexNoise;
  private time = 0;
  private offscreen: HTMLCanvasElement | null = null;
  private offCtx: CanvasRenderingContext2D | null = null;
  private currentColors: [number, number, number][] = [];
  private liquidColor: [number, number, number] = [40, 15, 5];
  private settling = false;

  constructor(noise: SimplexNoise) {
    this.noise = noise;
  }

  init(bounds: ScreenBounds, count: number): void {
    this.blobs = [];
    this.settling = false;

    const radiusScale = bounds.height / 500;

    for (let i = 0; i < count; i++) {
      const radius = (25 + Math.random() * 35) * radiusScale;
      const t = 0.2 + Math.random() * 0.7;
      const y = bounds.height * t;
      const x = bounds.width * (0.15 + Math.random() * 0.7);

      this.blobs.push({
        x, y,
        vx: 0, vy: 0,
        radius,
        temperature: t > 0.5 ? 0.7 : 0.3,
        colorIndex: i % 3,
        noiseOffset: i * 100,
      });
    }

    this.ensureOffscreen(bounds);
  }

  private ensureOffscreen(bounds: ScreenBounds): void {
    const w = Math.ceil(bounds.width / METABALL_SCALE) + 2;
    const h = Math.ceil(bounds.height / METABALL_SCALE) + 2;

    if (!this.offscreen || this.offscreen.width !== w || this.offscreen.height !== h) {
      this.offscreen = document.createElement('canvas');
      this.offscreen.width = w;
      this.offscreen.height = h;
      this.offCtx = this.offscreen.getContext('2d')!;
    }
  }

  update(dt: number, bounds: ScreenBounds): void {
    this.time += dt;

    for (const blob of this.blobs) {
      const normalizedY = blob.y / bounds.height; // 0=top, 1=bottom

      // Temperature dynamics
      if (!this.settling) {
        const heatGain = HEAT_RATE * Math.max(0, normalizedY - 0.4) * dt;
        const heatLoss = COOL_RATE * Math.max(0, 0.6 - normalizedY) * dt;
        blob.temperature = clamp(blob.temperature + heatGain - heatLoss, 0, 1);
      } else {
        blob.temperature = Math.max(0, blob.temperature - 0.0003 * dt);
      }

      // Buoyancy/gravity
      if (blob.temperature > 0.5) {
        blob.vy -= BUOYANCY * (blob.temperature - 0.5) * 2 * dt;
      } else {
        blob.vy += GRAVITY * (0.5 - blob.temperature) * 2 * dt;
      }

      // Horizontal noise drift
      const nx = this.noise.noise2D(
        blob.noiseOffset + this.time * NOISE_SCALE,
        blob.y * 0.005,
      );
      blob.vx += nx * NOISE_STRENGTH * dt;

      // Drag
      blob.vx *= DRAG;
      blob.vy *= DRAG;

      // Move
      blob.x += blob.vx * dt;
      blob.y += blob.vy * dt;

      // Containment — full screen edges
      const margin = blob.radius * 0.3;
      if (blob.x < margin) { blob.x = margin; blob.vx *= -0.3; }
      if (blob.x > bounds.width - margin) { blob.x = bounds.width - margin; blob.vx *= -0.3; }
      if (blob.y < margin) { blob.y = margin; blob.vy *= -0.2; blob.vy += 0.003; }
      if (blob.y > bounds.height - margin) { blob.y = bounds.height - margin; blob.vy *= -0.2; }
    }

    // Blob-blob repulsion
    for (let i = 0; i < this.blobs.length; i++) {
      for (let j = i + 1; j < this.blobs.length; j++) {
        const a = this.blobs[i];
        const b = this.blobs[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (a.radius + b.radius) * REPULSION_DIST;
        if (dist < minDist && dist > 0.1) {
          const force = REPULSION_FORCE * (1 - dist / minDist) * dt;
          const nx = dx / dist;
          const ny = dy / dist;
          a.vx -= nx * force;
          a.vy -= ny * force;
          b.vx += nx * force;
          b.vy += ny * force;
        }
      }
    }
  }

  setColors(
    colors: [number, number, number][],
    liquidColor: [number, number, number],
  ): void {
    this.currentColors = colors;
    this.liquidColor = liquidColor;
  }

  render(ctx: CanvasRenderingContext2D, bounds: ScreenBounds): void {
    this.ensureOffscreen(bounds);
    if (!this.offscreen || !this.offCtx) return;
    if (this.currentColors.length === 0) return;

    const oW = this.offscreen.width;
    const oH = this.offscreen.height;

    const imgData = this.offCtx.createImageData(oW, oH);
    const data = imgData.data;

    for (let py = 0; py < oH; py++) {
      const worldY = py * METABALL_SCALE;

      for (let px = 0; px < oW; px++) {
        const worldX = px * METABALL_SCALE;

        let field = 0;
        let dominantIdx = 0;
        let maxContrib = 0;

        for (let i = 0; i < this.blobs.length; i++) {
          const blob = this.blobs[i];
          const dx = worldX - blob.x;
          const dy = worldY - blob.y;
          const distSq = dx * dx + dy * dy;
          const contrib = (blob.radius * blob.radius) / (distSq + 1);
          field += contrib;
          if (contrib > maxContrib) {
            maxContrib = contrib;
            dominantIdx = blob.colorIndex;
          }
        }

        const idx = (py * oW + px) * 4;

        if (field > FIELD_THRESHOLD) {
          const c = this.currentColors[dominantIdx] || this.currentColors[0];
          const brightness = clamp(0.85 + (field - FIELD_THRESHOLD) * 0.1, 0.85, 1.15);
          data[idx] = clamp(Math.round(c[0] * brightness), 0, 255);
          data[idx + 1] = clamp(Math.round(c[1] * brightness), 0, 255);
          data[idx + 2] = clamp(Math.round(c[2] * brightness), 0, 255);
          data[idx + 3] = 255;
        } else if (field > GLOW_THRESHOLD) {
          const t = (field - GLOW_THRESHOLD) / (FIELD_THRESHOLD - GLOW_THRESHOLD);
          const smoothT = t * t;
          const lc = this.liquidColor;
          data[idx] = Math.round(lc[0] + (this.currentColors[dominantIdx][0] - lc[0]) * smoothT * 0.5);
          data[idx + 1] = Math.round(lc[1] + (this.currentColors[dominantIdx][1] - lc[1]) * smoothT * 0.5);
          data[idx + 2] = Math.round(lc[2] + (this.currentColors[dominantIdx][2] - lc[2]) * smoothT * 0.5);
          data[idx + 3] = Math.round(120 * smoothT);
        }
      }
    }

    this.offCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(
      this.offscreen,
      0, 0, oW, oH,
      0, 0, bounds.width, bounds.height,
    );
  }

  settle(): void {
    this.settling = true;
  }
}
