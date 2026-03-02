export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;
}

export class ParticlePool {
  private pool: Particle[];

  constructor(maxCount: number) {
    this.pool = Array.from({ length: maxCount }, () => ({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, size: 1, active: false,
    }));
  }

  emit(props: Partial<Particle>): Particle | null {
    const p = this.pool.find(p => !p.active);
    if (!p) return null;
    Object.assign(p, props, { active: true });
    return p;
  }

  update(dt: number, updater: (p: Particle, dt: number) => boolean): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      if (!updater(p, dt)) {
        p.active = false;
      }
    }
  }

  forEach(fn: (p: Particle) => void): void {
    for (const p of this.pool) {
      if (p.active) fn(p);
    }
  }
}
