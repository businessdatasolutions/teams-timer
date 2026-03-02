// 4-7-8 breathing cycle glow for the timer text

export class BreathingGlow {
  private phase = 0; // 0–19 seconds cycle
  private readonly cycleDuration = 19; // 4 + 7 + 8

  update(dt: number): void {
    this.phase = (this.phase + dt * 0.001) % this.cycleDuration;
  }

  getGlowIntensity(): number {
    if (this.phase < 4) {
      // Inhale: 0.3 → 1.0 with ease-in-out
      const t = this.phase / 4;
      return 0.3 + 0.7 * smoothstep(t);
    } else if (this.phase < 11) {
      // Hold: stay at 1.0 with subtle pulse
      const t = (this.phase - 4) / 7;
      return 0.95 + 0.05 * Math.sin(t * Math.PI * 2);
    } else {
      // Exhale: 1.0 → 0.3 with ease-in-out
      const t = (this.phase - 11) / 8;
      return 1.0 - 0.7 * smoothstep(t);
    }
  }
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
