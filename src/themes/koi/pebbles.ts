const COLORS = [
  '#1d383b', '#2a4b4f', '#1c3033', '#172728',
  '#3b3228', '#4a3f35', '#5c4a3a',
  '#7a6e5f', '#a09280',
  '#2d3a4a', '#3a4556', '#4b5668',
  '#2e4a40', '#3d5c50',
];

export function generatePebbles(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#234448';
  ctx.fillRect(0, 0, w, h);

  const count = (w * h) / 1000;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const radius = 4 + Math.random() * 28;
    const aspect = 0.7 + Math.random() * 0.5;
    const rotation = Math.random() * Math.PI;

    ctx.fillStyle = COLORS[Math.floor(Math.random() * COLORS.length)];
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * aspect, rotation, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.08})`;
    ctx.lineWidth = 1.5 + Math.random();
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.85, radius * aspect * 0.85, rotation, -Math.PI * 0.8, -Math.PI * 0.3);
    ctx.stroke();

    // Shadow
    ctx.strokeStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.1})`;
    ctx.lineWidth = 1.5 + Math.random();
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.9, radius * aspect * 0.9, rotation, Math.PI * 0.1, Math.PI * 0.7);
    ctx.stroke();
  }

  return c;
}

export function generateVignette(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const grad = ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(0,10,15,0.15)');
  grad.addColorStop(1, 'rgba(0,10,15,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return c;
}
