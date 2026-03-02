interface HistoryPoint {
  x: number;
  y: number;
}

interface Spot {
  historyIndex: number;
  size: number;
  color: string;
  offsetX: number;
}

interface KoiColors {
  body: string;
  head: string;
  spots: string[];
}

const PALETTES: KoiColors[] = [
  { body: '#f8f9fa', head: '#f8f9fa', spots: ['#e85d04'] },
  { body: '#f8f9fa', head: '#e85d04', spots: ['#e85d04', '#111111'] },
  { body: '#111111', head: '#111111', spots: ['#f8f9fa', '#e85d04'] },
  { body: '#ffd700', head: '#ffd700', spots: [] },
  { body: '#e85d04', head: '#e85d04', spots: ['#111111', '#f8f9fa'] },
];

export class Koi {
  x: number;
  y: number;
  private vx: number;
  private vy: number;
  private speed: number;
  private history: HistoryPoint[];
  private historyLength = 35;
  private colors: KoiColors;
  private size: number;
  private spots: Spot[];

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = Math.random() - 0.5;
    this.vy = Math.random() - 0.5;
    this.speed = 1.0 + Math.random() * 0.6;
    this.history = [];
    this.colors = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    this.size = 12 + Math.random() * 5;

    this.spots = [];
    const numSpots = this.colors.spots.length > 0 ? 3 + Math.floor(Math.random() * 5) : 0;
    for (let i = 0; i < numSpots; i++) {
      this.spots.push({
        historyIndex: 4 + Math.floor(Math.random() * 22),
        size: this.size * (0.8 + Math.random() * 1.5),
        color: this.colors.spots[Math.floor(Math.random() * this.colors.spots.length)],
        offsetX: (Math.random() - 0.5) * this.size,
      });
    }
  }

  update(dt: number, canvasW: number, canvasH: number): void {
    const scale = dt / 16.67;

    // Wander
    let angle = Math.atan2(this.vy, this.vx);
    angle += (Math.random() - 0.5) * 0.3;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;

    // Avoid edges
    const margin = 100;
    const turn = 0.05;
    if (this.x < margin) this.vx += turn;
    if (this.x > canvasW - margin) this.vx -= turn;
    if (this.y < margin) this.vy += turn;
    if (this.y > canvasH - margin) this.vy -= turn;

    // Avoid center stone
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const dx = cx - this.x;
    const dy = cy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 220) {
      this.vx -= (dx / dist) * turn * 1.5;
      this.vy -= (dy / dist) * turn * 1.5;
    }

    // Normalize
    const cs = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.vx = (this.vx / cs) * this.speed;
    this.vy = (this.vy / cs) * this.speed;

    this.x += this.vx * scale;
    this.y += this.vy * scale;

    this.history.unshift({ x: this.x, y: this.y });
    if (this.history.length > this.historyLength) this.history.pop();
  }

  drawShadow(ctx: CanvasRenderingContext2D): void {
    if (this.history.length < 5) return;
    const ox = 8, oy = 12;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';

    const { leftPoints, rightPoints } = this.computeBodyPolygon(ox, oy);
    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i < leftPoints.length; i++) ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    for (let i = 0; i < rightPoints.length; i++) ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    ctx.closePath();
    ctx.fill();

    const head = this.history[0];
    ctx.beginPath();
    ctx.arc(head.x + ox, head.y + oy, this.size * 1.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.history.length < 5) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const head = this.history[0];
    const bodyAngle = Math.atan2(this.vy, this.vx);
    const s = this.size;

    // --- Pectoral fins (flowing, translucent with many rays) ---
    const finBase = this.history[4];
    const finDir = this.history[0];
    const finAngle = Math.atan2(finDir.y - finBase.y, finDir.x - finBase.x);

    ctx.save();
    ctx.translate(finBase.x, finBase.y);
    ctx.rotate(finAngle);

    for (const side of [-1, 1]) {
      // Fin membrane
      ctx.fillStyle = 'rgba(240,230,220,0.3)';
      ctx.beginPath();
      ctx.moveTo(0, side * s * 0.4);
      ctx.bezierCurveTo(
        s * 0.6, side * s * 1.6,
        -s * 0.4, side * s * 2.8,
        -s * 1.8, side * s * 2.6
      );
      ctx.bezierCurveTo(
        -s * 1.0, side * s * 1.8,
        -s * 0.4, side * s * 1.0,
        -s * 0.15, side * s * 0.6
      );
      ctx.closePath();
      ctx.fill();

      // Outer edge highlight
      ctx.strokeStyle = 'rgba(200,190,180,0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, side * s * 0.4);
      ctx.bezierCurveTo(
        s * 0.6, side * s * 1.6,
        -s * 0.4, side * s * 2.8,
        -s * 1.8, side * s * 2.6
      );
      ctx.stroke();

      // Fin rays (5 rays for detail)
      ctx.strokeStyle = 'rgba(180,170,160,0.25)';
      ctx.lineWidth = 0.4;
      const rayTargets = [
        { x: s * 0.3, y: side * s * 2.2 },
        { x: -s * 0.2, y: side * s * 2.6 },
        { x: -s * 0.8, y: side * s * 2.5 },
        { x: -s * 1.3, y: side * s * 2.2 },
        { x: -s * 1.6, y: side * s * 1.6 },
      ];
      for (const t of rayTargets) {
        ctx.beginPath();
        ctx.moveTo(0, side * s * 0.4);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // --- Tail fin (forked, flowing with many rays) ---
    const tailBase = this.history[this.history.length - 5] || this.history[this.history.length - 1];
    const tailEnd = this.history[this.history.length - 1];
    const tailAngle = Math.atan2(tailEnd.y - tailBase.y, tailEnd.x - tailBase.x);

    ctx.save();
    ctx.translate(tailEnd.x, tailEnd.y);
    ctx.rotate(tailAngle);

    // Upper lobe
    ctx.fillStyle = 'rgba(240,230,220,0.3)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.15);
    ctx.bezierCurveTo(s * 1.0, -s * 0.8, s * 2.0, -s * 1.8, s * 3.2, -s * 2.0);
    ctx.bezierCurveTo(s * 2.5, -s * 1.2, s * 1.5, -s * 0.4, s * 0.6, 0);
    ctx.closePath();
    ctx.fill();

    // Lower lobe
    ctx.beginPath();
    ctx.moveTo(0, s * 0.15);
    ctx.bezierCurveTo(s * 1.0, s * 0.8, s * 2.0, s * 1.8, s * 3.2, s * 2.0);
    ctx.bezierCurveTo(s * 2.5, s * 1.2, s * 1.5, s * 0.4, s * 0.6, 0);
    ctx.closePath();
    ctx.fill();

    // Tail edge highlights
    ctx.strokeStyle = 'rgba(200,190,180,0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.15);
    ctx.bezierCurveTo(s * 1.0, -s * 0.8, s * 2.0, -s * 1.8, s * 3.2, -s * 2.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, s * 0.15);
    ctx.bezierCurveTo(s * 1.0, s * 0.8, s * 2.0, s * 1.8, s * 3.2, s * 2.0);
    ctx.stroke();

    // Tail rays (6 per lobe)
    ctx.strokeStyle = 'rgba(180,170,160,0.2)';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      // Upper rays
      const ux = s * (0.8 + t * 2.2);
      const uy = -s * (0.3 + t * 1.5);
      ctx.beginPath(); ctx.moveTo(0, -s * 0.1); ctx.lineTo(ux, uy); ctx.stroke();
      // Lower rays
      ctx.beginPath(); ctx.moveTo(0, s * 0.1); ctx.lineTo(ux, -uy); ctx.stroke();
    }
    ctx.restore();

    // --- Body polygon ---
    const { leftPoints, rightPoints } = this.computeBodyPolygon(0, 0);
    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i < leftPoints.length; i++) ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    for (let i = 0; i < rightPoints.length; i++) ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    ctx.closePath();
    ctx.fillStyle = this.colors.body;
    ctx.fill();

    // --- Pattern spots (clipped to body) ---
    ctx.save();
    ctx.clip();
    for (const spot of this.spots) {
      const pt = this.history[spot.historyIndex];
      if (!pt) continue;
      let sAngle = 0;
      if (spot.historyIndex > 0) {
        const prev = this.history[spot.historyIndex - 1];
        sAngle = Math.atan2(pt.y - prev.y, pt.x - prev.x);
      }
      const perp = sAngle + Math.PI / 2;
      const sx = pt.x + Math.cos(perp) * spot.offsetX;
      const sy = pt.y + Math.sin(perp) * spot.offsetX;
      ctx.beginPath();
      ctx.arc(sx, sy, spot.size, 0, Math.PI * 2);
      ctx.fillStyle = spot.color;
      ctx.fill();
    }

    // --- Scale texture (drawn clipped to body) ---
    ctx.globalAlpha = 0.12;
    for (let i = 2; i < this.history.length - 3; i += 1) {
      const p = this.history[i];
      const pNext = this.history[Math.min(i + 1, this.history.length - 1)];
      const angle = Math.atan2(pNext.y - p.y, pNext.x - p.x);
      const perp = angle + Math.PI / 2;
      const progress = i / this.history.length;
      const taper = progress < 0.1 ? 0.8 + 0.2 * (progress / 0.1) : 1 - Math.pow((progress - 0.1) / 0.9, 1.4);
      const w = s * taper * 1.3;

      const scaleRows = Math.max(1, Math.round(w / (s * 0.35)));
      for (let r = -scaleRows; r <= scaleRows; r++) {
        const cx = p.x + Math.cos(perp) * (r * s * 0.32);
        const cy = p.y + Math.sin(perp) * (r * s * 0.32);
        const scaleSize = s * 0.22;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, scaleSize, angle - Math.PI * 0.6, angle + Math.PI * 0.6);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // --- Body outline ---
    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i < leftPoints.length; i++) ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    for (let i = 0; i < rightPoints.length; i++) ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // --- Body highlight (3D shading) ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i < leftPoints.length; i++) ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    for (let i = 0; i < rightPoints.length; i++) ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    ctx.closePath();
    ctx.clip();
    // Highlight along the upper body
    for (let i = 1; i < this.history.length - 4; i += 2) {
      const p = this.history[i];
      const pNext = this.history[Math.min(i + 1, this.history.length - 1)];
      const angle = Math.atan2(pNext.y - p.y, pNext.x - p.x);
      const perp = angle + Math.PI / 2;
      const progress = i / this.history.length;
      const taper = progress < 0.1 ? 0.8 + 0.2 * (progress / 0.1) : 1 - Math.pow((progress - 0.1) / 0.9, 1.4);
      const w = s * taper * 0.6;
      const hx = p.x + Math.cos(perp) * w;
      const hy = p.y + Math.sin(perp) * w;
      ctx.beginPath();
      ctx.arc(hx, hy, s * 0.5 * taper, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
    }
    ctx.restore();

    // --- Dorsal fin ---
    ctx.beginPath();
    for (let i = 4; i < 22; i++) {
      if (!this.history[i]) continue;
      if (i === 4) ctx.moveTo(this.history[i].x, this.history[i].y);
      else ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = s * 0.3;
    ctx.stroke();

    // --- Head (slightly elongated) ---
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(bodyAngle);

    // Head shape: elongated oval
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.2, s * 0.95, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.head;
    ctx.fill();

    // Head highlight
    ctx.beginPath();
    ctx.ellipse(s * 0.15, -s * 0.2, s * 0.6, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();

    // Gill line
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-s * 0.3, 0, s * 0.85, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    // Mouth
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(s * 1.1, 0, s * 0.15, Math.PI * 0.3, -Math.PI * 0.3, true);
    ctx.stroke();

    // Barbels (longer, more organic curves)
    ctx.strokeStyle = 'rgba(80,60,40,0.3)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 0.4);
    ctx.bezierCurveTo(s * 1.3, -s * 0.8, s * 1.4, -s * 1.4, s * 1.0, -s * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.9, s * 0.4);
    ctx.bezierCurveTo(s * 1.3, s * 0.8, s * 1.4, s * 1.4, s * 1.0, s * 1.7);
    ctx.stroke();

    // Eyes (detailed with iris and highlight)
    for (const side of [-1, 1]) {
      const ey = side * s * 0.55;
      // Eye white
      ctx.fillStyle = '#f5f0e8';
      ctx.beginPath();
      ctx.arc(s * 0.5, ey, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // Iris ring
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.arc(s * 0.5, ey, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(s * 0.52, ey, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(s * 0.47, ey - s * 0.04, s * 0.04, 0, Math.PI * 2);
      ctx.fill();
      // Eye outline
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(s * 0.5, ey, s * 0.18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private computeBodyPolygon(offsetX: number, offsetY: number) {
    const leftPoints: HistoryPoint[] = [];
    const rightPoints: HistoryPoint[] = [];

    for (let i = 0; i < this.history.length; i++) {
      const p = this.history[i];
      let angle: number;
      if (i === 0) {
        angle = Math.atan2(this.history[1].y - p.y, this.history[1].x - p.x);
      } else if (i === this.history.length - 1) {
        angle = Math.atan2(p.y - this.history[i - 1].y, p.x - this.history[i - 1].x);
      } else {
        angle = Math.atan2(this.history[i + 1].y - this.history[i - 1].y, this.history[i + 1].x - this.history[i - 1].x);
      }

      const progress = i / this.history.length;
      let width: number;
      if (progress < 0.1) {
        width = this.size * (0.8 + 0.2 * (progress / 0.1));
      } else {
        const taper = (progress - 0.1) / 0.9;
        width = this.size * (1 - Math.pow(taper, 1.4));
      }

      const perp = angle + Math.PI / 2;
      const w = width * 1.3;
      leftPoints.push({ x: p.x + Math.cos(perp) * w + offsetX, y: p.y + Math.sin(perp) * w + offsetY });
      rightPoints.unshift({ x: p.x - Math.cos(perp) * w + offsetX, y: p.y - Math.sin(perp) * w + offsetY });
    }
    return { leftPoints, rightPoints };
  }
}
