export interface LampGeometry {
  cx: number;
  top: number;
  bottom: number;
  height: number;
  capTop: number;
  capBottom: number;
  baseTop: number;
  baseBottom: number;
  getRadius(y: number): number;
}

export function computeLampGeometry(w: number, h: number): LampGeometry {
  const lampHeight = h * 0.72;
  const capHeight = lampHeight * 0.035;
  const baseHeight = lampHeight * 0.07;
  const capTop = h * 0.08;
  const capBottom = capTop + capHeight;
  const baseTop = capTop + lampHeight - baseHeight;
  const baseBottom = capTop + lampHeight;

  const cx = w / 2;
  const innerTop = capBottom;
  const innerBottom = baseTop;
  const innerHeight = innerBottom - innerTop;

  // Shape control points (t=0 is top, t=1 is bottom)
  const neckRadius = lampHeight * 0.065;
  const bulgeRadius = lampHeight * 0.155;
  const baseRadius = lampHeight * 0.11;

  function getRadius(y: number): number {
    const t = (y - innerTop) / innerHeight;
    if (t <= 0) return neckRadius;
    if (t >= 1) return baseRadius;

    // Piecewise smooth profile
    if (t < 0.15) {
      // Neck to widening
      const s = t / 0.15;
      const ease = s * s * (3 - 2 * s); // smoothstep
      return neckRadius + (bulgeRadius * 0.6 - neckRadius) * ease;
    } else if (t < 0.4) {
      // Widening to max bulge
      const s = (t - 0.15) / 0.25;
      const ease = s * s * (3 - 2 * s);
      return bulgeRadius * 0.6 + (bulgeRadius - bulgeRadius * 0.6) * ease;
    } else if (t < 0.8) {
      // Bulge plateau with gentle taper
      const s = (t - 0.4) / 0.4;
      return bulgeRadius - (bulgeRadius - bulgeRadius * 0.92) * s;
    } else {
      // Taper to base
      const s = (t - 0.8) / 0.2;
      const ease = s * s * (3 - 2 * s);
      return bulgeRadius * 0.92 - (bulgeRadius * 0.92 - baseRadius) * ease;
    }
  }

  return {
    cx, top: innerTop, bottom: innerBottom, height: innerHeight,
    capTop, capBottom, baseTop, baseBottom, getRadius,
  };
}

export function createLampClipPath(ctx: CanvasRenderingContext2D, geom: LampGeometry): void {
  const steps = 200;
  ctx.beginPath();

  // Left side (top to bottom)
  for (let i = 0; i <= steps; i++) {
    const y = geom.top + (geom.height * i) / steps;
    const r = geom.getRadius(y);
    const x = geom.cx - r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  // Right side (bottom to top)
  for (let i = steps; i >= 0; i--) {
    const y = geom.top + (geom.height * i) / steps;
    const r = geom.getRadius(y);
    const x = geom.cx + r;
    ctx.lineTo(x, y);
  }

  ctx.closePath();
}

export function drawLampBase(ctx: CanvasRenderingContext2D, geom: LampGeometry): void {
  const baseR = geom.getRadius(geom.bottom) * 1.25;
  const capR = geom.getRadius(geom.bottom) * 1.05;

  ctx.save();
  ctx.beginPath();
  // Trapezoid: wider at bottom
  ctx.moveTo(geom.cx - capR, geom.baseTop);
  ctx.lineTo(geom.cx + capR, geom.baseTop);
  ctx.lineTo(geom.cx + baseR, geom.baseBottom);
  ctx.lineTo(geom.cx - baseR, geom.baseBottom);
  ctx.closePath();

  const grad = ctx.createLinearGradient(geom.cx - baseR, 0, geom.cx + baseR, 0);
  grad.addColorStop(0, '#2a2a2a');
  grad.addColorStop(0.3, '#5a5a5a');
  grad.addColorStop(0.5, '#7a7a7a');
  grad.addColorStop(0.7, '#5a5a5a');
  grad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = grad;
  ctx.fill();

  // Top edge highlight
  ctx.beginPath();
  ctx.moveTo(geom.cx - capR, geom.baseTop);
  ctx.lineTo(geom.cx + capR, geom.baseTop);
  ctx.strokeStyle = 'rgba(180,180,180,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

export function drawLampCap(ctx: CanvasRenderingContext2D, geom: LampGeometry): void {
  const topR = geom.getRadius(geom.top) * 0.85;
  const bottomR = geom.getRadius(geom.top) * 1.05;

  ctx.save();
  ctx.beginPath();
  // Trapezoid: wider at bottom
  ctx.moveTo(geom.cx - topR, geom.capTop);
  ctx.lineTo(geom.cx + topR, geom.capTop);
  ctx.lineTo(geom.cx + bottomR, geom.capBottom);
  ctx.lineTo(geom.cx - bottomR, geom.capBottom);
  ctx.closePath();

  const grad = ctx.createLinearGradient(geom.cx - bottomR, 0, geom.cx + bottomR, 0);
  grad.addColorStop(0, '#2a2a2a');
  grad.addColorStop(0.3, '#5a5a5a');
  grad.addColorStop(0.5, '#7a7a7a');
  grad.addColorStop(0.7, '#5a5a5a');
  grad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = grad;
  ctx.fill();

  // Bottom edge shadow
  ctx.beginPath();
  ctx.moveTo(geom.cx - bottomR, geom.capBottom);
  ctx.lineTo(geom.cx + bottomR, geom.capBottom);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function drawGlassHighlights(ctx: CanvasRenderingContext2D, geom: LampGeometry): void {
  ctx.save();

  // Left highlight streak
  const steps = 120;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = geom.top + geom.height * t;
    const r = geom.getRadius(y);
    const x = geom.cx - r * 0.82;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = geom.top + geom.height * t;
    const r = geom.getRadius(y);
    const x = geom.cx - r * 0.72;
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  const maxR = geom.getRadius(geom.top + geom.height * 0.4);
  const highlightGrad = ctx.createLinearGradient(
    geom.cx - maxR, geom.top, geom.cx - maxR, geom.bottom
  );
  highlightGrad.addColorStop(0, 'rgba(255,255,255,0.01)');
  highlightGrad.addColorStop(0.2, 'rgba(255,255,255,0.08)');
  highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  highlightGrad.addColorStop(0.8, 'rgba(255,255,255,0.06)');
  highlightGrad.addColorStop(1, 'rgba(255,255,255,0.01)');
  ctx.fillStyle = highlightGrad;
  ctx.fill();

  // Right subtle highlight
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = geom.top + geom.height * t;
    const r = geom.getRadius(y);
    const x = geom.cx + r * 0.75;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = geom.top + geom.height * t;
    const r = geom.getRadius(y);
    const x = geom.cx + r * 0.85;
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  const rightGrad = ctx.createLinearGradient(
    geom.cx + maxR, geom.top, geom.cx + maxR, geom.bottom
  );
  rightGrad.addColorStop(0, 'rgba(255,255,255,0.0)');
  rightGrad.addColorStop(0.3, 'rgba(255,255,255,0.04)');
  rightGrad.addColorStop(0.6, 'rgba(255,255,255,0.06)');
  rightGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = rightGrad;
  ctx.fill();

  ctx.restore();
}

export function drawBaseGlow(
  ctx: CanvasRenderingContext2D,
  geom: LampGeometry,
  intensity: number,
  color: [number, number, number],
): void {
  if (intensity <= 0) return;

  ctx.save();
  const baseR = geom.getRadius(geom.bottom) * 2.5;
  const grad = ctx.createRadialGradient(
    geom.cx, geom.baseBottom, 0,
    geom.cx, geom.baseBottom, baseR,
  );
  const a = intensity * 0.35;
  grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${a})`);
  grad.addColorStop(0.4, `rgba(${color[0]},${color[1]},${color[2]},${a * 0.4})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(geom.cx - baseR, geom.baseBottom - baseR, baseR * 2, baseR * 2);
  ctx.restore();
}

export function drawLampOutline(ctx: CanvasRenderingContext2D, geom: LampGeometry): void {
  ctx.save();
  createLampClipPath(ctx, geom);
  ctx.strokeStyle = 'rgba(120,120,140,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
