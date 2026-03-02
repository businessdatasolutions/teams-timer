interface CausticLayer {
  xFreq: number;
  yFreq: number;
  xPhase: number;
  yPhase: number;
  scaleFreq: number;
  baseRadius: number;
}

export class Caustics {
  private layers: CausticLayer[];

  constructor(count = 5) {
    this.layers = Array.from({ length: count }, (_, i) => ({
      xFreq: 0.0003 + i * 0.00012,
      yFreq: 0.0004 + i * 0.00009,
      xPhase: i * 1.3,
      yPhase: i * 0.9,
      scaleFreq: 0.0002 + i * 0.00005,
      baseRadius: 0.25 + i * 0.06,
    }));
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const c of this.layers) {
      const cx = w / 2 + Math.sin(time * c.xFreq + c.xPhase) * w * 0.3;
      const cy = h / 2 + Math.cos(time * c.yFreq + c.yPhase) * h * 0.3;
      const r = w * c.baseRadius * (0.8 + 0.2 * Math.sin(time * c.scaleFreq));
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(180,220,210,0.06)');
      grad.addColorStop(0.5, 'rgba(180,220,210,0.025)');
      grad.addColorStop(1, 'rgba(180,220,210,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.7, time * c.xFreq, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
