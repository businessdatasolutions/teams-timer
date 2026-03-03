import { LampGeometry } from './lamp';

type RGB = [number, number, number];

const RAY_COUNT = 6;

export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  geom: LampGeometry,
  glowColor: RGB,
  intensity: number,
  colors: RGB[],
  time: number,
): void {
  // -- Wall background --
  const wallGrad = ctx.createRadialGradient(
    geom.cx, geom.top + geom.height * 0.4, 0,
    geom.cx, geom.top + geom.height * 0.4, Math.max(w, h) * 0.8,
  );
  wallGrad.addColorStop(0, '#15101a');
  wallGrad.addColorStop(0.5, '#0e0a12');
  wallGrad.addColorStop(1, '#08060c');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  // -- Light rays on wall --
  drawLightRays(ctx, w, h, geom, colors, intensity, time);

  // -- Light cast on wall behind lamp --
  ctx.save();
  const glowCenterY = geom.top + geom.height * 0.45;
  const glowRadiusX = w * 0.45;
  const glowRadiusY = geom.height * 0.7;

  ctx.translate(geom.cx, glowCenterY);
  ctx.scale(glowRadiusX / glowRadiusY, 1);

  const wallGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadiusY);
  const a = intensity * 0.12;
  wallGlow.addColorStop(0, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${a})`);
  wallGlow.addColorStop(0.3, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${a * 0.6})`);
  wallGlow.addColorStop(0.7, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${a * 0.15})`);
  wallGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wallGlow;
  ctx.fillRect(-glowRadiusY, -glowRadiusY, glowRadiusY * 2, glowRadiusY * 2);
  ctx.restore();

}

function drawLightRays(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  geom: LampGeometry,
  colors: RGB[],
  intensity: number,
  time: number,
): void {
  if (intensity <= 0.05) return;

  const lampCenterY = geom.top + geom.height * 0.45;
  const rayLength = Math.max(w, h) * 0.9;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < RAY_COUNT; i++) {
    // Base angle evenly spaced, with per-ray offset for asymmetry
    const baseAngle = (i / RAY_COUNT) * Math.PI * 2;
    // Slow rotation + slight wobble per ray
    const wobble = Math.sin(time * 0.0003 + i * 2.1) * 0.15;
    const angle = baseAngle + time * 0.00008 + wobble;

    // Ray width varies per ray for visual interest
    const rayWidth = rayLength * (0.12 + Math.sin(i * 1.7) * 0.04);

    const color = colors[i % colors.length];
    const alpha = intensity * (0.025 + Math.sin(time * 0.0005 + i * 1.3) * 0.008);

    ctx.save();
    ctx.translate(geom.cx, lampCenterY);
    ctx.rotate(angle);

    // Gradient along the ray length
    const grad = ctx.createLinearGradient(0, 0, rayLength, 0);
    grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${alpha})`);
    grad.addColorStop(0.3, `rgba(${color[0]},${color[1]},${color[2]},${alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(rayLength, -rayWidth / 2);
    ctx.lineTo(rayLength, rayWidth / 2);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
