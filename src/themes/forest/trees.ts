// SVG tree silhouette layers with CSS sway animation, parallax, and wind gust support
// Each tree returns separate trunk and crown paths so they can be filled with different colors.

// Origin (0,0) is at the ground-center of the tree. Y goes up (negative).

interface TreePaths {
  trunk: string;
  crown: string;
}

// Per-layer trunk colors — darker layers get darker trunks
const TRUNK_COLORS = ['#0c0a06', '#100d08', '#15110a', '#1a150d', '#201a10'];

function pine(h: number, w: number): TreePaths {
  const tw = w * 0.08;
  const trunkH = h * 0.18;
  const crownBase = trunkH;
  const tiers = 4 + Math.floor(Math.random() * 2);
  const tierH = (h - crownBase) / tiers;

  // Trunk: rectangle with slight flare at base
  const flare = tw * 1.4;
  const trunk = `M${-flare},0 L${-tw},${-crownBase} L${tw},${-crownBase} L${flare},0 Z`;

  // Crown: tiered boughs starting from trunk top
  let d = '';
  // Left side (bottom to top)
  const bottomSpread = w * 0.5;
  d += `M${-bottomSpread},${-crownBase} `;
  for (let i = 0; i < tiers; i++) {
    const y = crownBase + i * tierH;
    const nextY = crownBase + (i + 1) * tierH;
    const spread = w * 0.5 * (1 - i * 0.12);
    const indent = spread * 0.35;
    d += `L${-spread},${-y} `;
    if (i < tiers - 1) {
      d += `L${-indent},${-nextY + tierH * 0.15} `;
    }
  }
  d += `L0,${-h} `;
  // Right side (top to bottom)
  for (let i = tiers - 1; i >= 0; i--) {
    const y = crownBase + i * tierH;
    const nextY = crownBase + (i + 1) * tierH;
    const spread = w * 0.5 * (1 - i * 0.12);
    const indent = spread * 0.35;
    if (i < tiers - 1) {
      d += `L${indent},${-nextY + tierH * 0.15} `;
    }
    d += `L${spread},${-y} `;
  }
  d += `L${bottomSpread},${-crownBase} Z`;

  return { trunk, crown: d };
}

function deciduous(h: number, w: number): TreePaths {
  const tw = w * 0.06;
  const trunkH = h * 0.35;
  const crownW = w * 0.5;
  const crownH = h - trunkH;
  const crownY = trunkH;
  const flare = tw * 2.2;

  // Trunk: flared base tapering up, with slight curves
  let trunk = `M${-flare},0 `;
  trunk += `Q${-tw * 1.3},${-trunkH * 0.3} ${-tw},${-trunkH * 0.7} `;
  trunk += `L${-tw * 0.8},${-trunkH} `;
  trunk += `L${tw * 0.8},${-trunkH} `;
  trunk += `L${tw},${-trunkH * 0.7} `;
  trunk += `Q${tw * 1.3},${-trunkH * 0.3} ${flare},0 Z`;

  // Crown: organic rounded shape sitting on top of trunk
  let crown = `M${-tw * 1.1},${-crownY} `;
  crown += `Q${-crownW * 0.6},${-crownY - crownH * 0.05} ${-crownW * 0.8},${-crownY - crownH * 0.2} `;
  crown += `Q${-crownW * 1.05},${-crownY - crownH * 0.35} ${-crownW},${-crownY - crownH * 0.55} `;
  crown += `Q${-crownW * 0.85},${-crownY - crownH * 0.85} ${-crownW * 0.35},${-crownY - crownH * 0.95} `;
  crown += `Q${-crownW * 0.05},${-h * 1.02} ${crownW * 0.15},${-crownY - crownH * 0.97} `;
  crown += `Q${crownW * 0.7},${-crownY - crownH * 0.88} ${crownW * 0.9},${-crownY - crownH * 0.6} `;
  crown += `Q${crownW * 1.05},${-crownY - crownH * 0.35} ${crownW * 0.8},${-crownY - crownH * 0.18} `;
  crown += `Q${crownW * 0.55},${-crownY - crownH * 0.03} ${tw * 1.1},${-crownY} Z`;

  return { trunk, crown };
}

function birch(h: number, w: number): TreePaths {
  const tw = w * 0.035;
  const trunkH = h * 0.5;
  const crownW = w * 0.3;
  const crownH = h - trunkH;
  const flare = tw * 1.8;

  // Trunk: thin, tall, slight taper
  const trunk = `M${-flare},0 L${-tw},${-trunkH} L${tw},${-trunkH} L${flare},0 Z`;

  // Crown: small wispy canopy
  let crown = `M${-tw * 1.5},${-trunkH} `;
  crown += `Q${-tw * 2},${-trunkH - crownH * 0.05} ${-crownW * 0.5},${-trunkH - crownH * 0.2} `;
  crown += `Q${-crownW},${-trunkH - crownH * 0.45} ${-crownW * 0.7},${-trunkH - crownH * 0.7} `;
  crown += `Q${-crownW * 0.4},${-h * 0.98} ${0},${-h} `;
  crown += `Q${crownW * 0.35},${-h * 0.97} ${crownW * 0.65},${-trunkH - crownH * 0.65} `;
  crown += `Q${crownW * 0.9},${-trunkH - crownH * 0.4} ${crownW * 0.45},${-trunkH - crownH * 0.15} `;
  crown += `Q${tw * 2},${-trunkH - crownH * 0.03} ${tw * 1.5},${-trunkH} Z`;

  return { trunk, crown };
}

function spruce(h: number, w: number): TreePaths {
  const tw = w * 0.06;
  const trunkH = h * 0.12;
  const tiers = 6 + Math.floor(Math.random() * 2);
  const tierH = (h - trunkH) / tiers;
  const flare = tw * 1.3;

  // Trunk
  const trunk = `M${-flare},0 L${-tw},${-trunkH} L${tw},${-trunkH} L${flare},0 Z`;

  // Crown: dense conical tiers
  const bottomSpread = w * 0.45;
  let d = `M${-bottomSpread},${-trunkH} `;
  for (let i = 0; i < tiers; i++) {
    const y = trunkH + i * tierH;
    const nextY = trunkH + (i + 1) * tierH;
    const spread = w * 0.45 * (1 - (i / tiers) * 0.7);
    const indent = spread * 0.45;
    d += `L${-spread},${-y} `;
    if (i < tiers - 1) {
      d += `L${-indent},${-nextY + tierH * 0.2} `;
    }
  }
  d += `L0,${-h} `;
  for (let i = tiers - 1; i >= 0; i--) {
    const y = trunkH + i * tierH;
    const nextY = trunkH + (i + 1) * tierH;
    const spread = w * 0.45 * (1 - (i / tiers) * 0.7);
    const indent = spread * 0.45;
    if (i < tiers - 1) {
      d += `L${indent},${-nextY + tierH * 0.2} `;
    }
    d += `L${spread},${-y} `;
  }
  d += `L${bottomSpread},${-trunkH} Z`;

  return { trunk, crown: d };
}

function oak(h: number, w: number): TreePaths {
  const tw = w * 0.09;
  const trunkH = h * 0.3;
  const crownW = w * 0.55;
  const crownH = h - trunkH;
  const flare = tw * 2.5;

  // Trunk: thick with root buttress, branches diverging at top
  let trunk = `M${-flare},0 `;
  trunk += `Q${-tw * 1.5},${-trunkH * 0.2} ${-tw * 1.2},${-trunkH * 0.6} `;
  trunk += `L${-tw},${-trunkH} `;
  trunk += `L${tw},${-trunkH} `;
  trunk += `L${tw * 1.2},${-trunkH * 0.6} `;
  trunk += `Q${tw * 1.5},${-trunkH * 0.2} ${flare},0 Z`;

  // Crown: wide, bumpy, sprawling
  let crown = `M${-tw * 1.5},${-trunkH} `;
  crown += `Q${-tw * 2.5},${-trunkH * 0.95} ${-crownW * 0.8},${-trunkH - crownH * 0.1} `;
  crown += `Q${-crownW * 1.1},${-trunkH - crownH * 0.25} ${-crownW},${-trunkH - crownH * 0.45} `;
  crown += `Q${-crownW * 0.95},${-trunkH - crownH * 0.65} ${-crownW * 0.6},${-trunkH - crownH * 0.8} `;
  crown += `Q${-crownW * 0.35},${-h * 1.01} ${-crownW * 0.1},${-trunkH - crownH * 0.92} `;
  crown += `Q${crownW * 0.1},${-h * 1.02} ${crownW * 0.3},${-trunkH - crownH * 0.88} `;
  crown += `Q${crownW * 0.6},${-trunkH - crownH * 0.82} ${crownW * 0.85},${-trunkH - crownH * 0.55} `;
  crown += `Q${crownW * 1.1},${-trunkH - crownH * 0.3} ${crownW * 0.85},${-trunkH - crownH * 0.08} `;
  crown += `Q${tw * 3},${-trunkH * 0.95} ${tw * 1.5},${-trunkH} Z`;

  return { trunk, crown };
}

// Tree generators
const TREE_TYPES: Array<{ gen: (h: number, w: number) => TreePaths; h: number; w: number; weight: number }> = [
  { gen: pine,      h: 400, w: 110, weight: 3 },
  { gen: deciduous, h: 350, w: 160, weight: 2 },
  { gen: birch,     h: 380, w: 80,  weight: 2 },
  { gen: spruce,    h: 420, w: 90,  weight: 3 },
  { gen: oak,       h: 320, w: 200, weight: 1 },
];

function pickTreeType(): typeof TREE_TYPES[number] {
  const totalWeight = TREE_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * totalWeight;
  for (const t of TREE_TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return TREE_TYPES[0];
}

const LAYER_CONFIG = [
  { color: '#050e05', count: 10, scale: 1.0,  swayDeg: 0.3, swayDuration: 11.3, parallax: 0.002 },
  { color: '#081408', count: 12, scale: 1.15, swayDeg: 0.5, swayDuration: 9.7,  parallax: 0.004 },
  { color: '#0a1a0a', count: 14, scale: 1.3,  swayDeg: 0.7, swayDuration: 8.1,  parallax: 0.006 },
  { color: '#0d220d', count: 16, scale: 1.45, swayDeg: 0.9, swayDuration: 7.3,  parallax: 0.008 },
  { color: '#112a11', count: 20, scale: 1.6,  swayDeg: 1.2, swayDuration: 6.5,  parallax: 0.01 },
];

const layerWrappers: HTMLElement[] = [];

export function createTreeLayer(
  container: HTMLElement,
  layerIndex: number,
): void {
  const cfg = LAYER_CONFIG[layerIndex];
  const trunkColor = TRUNK_COLORS[layerIndex];

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:${2 + layerIndex};pointer-events:none;transition:transform 0.3s ease-out;`;
  wrapper.dataset.layer = String(layerIndex);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  svg.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;height:100%;';

  const baseY = window.innerHeight;

  for (let i = 0; i < cfg.count; i++) {
    const x = (i / cfg.count) * window.innerWidth + (Math.random() - 0.5) * 80;
    const treeType = pickTreeType();
    const sizeVariation = 0.8 + Math.random() * 0.4;
    const treeH = treeType.h * sizeVariation;
    const treeW = treeType.w * sizeVariation;
    const tree = treeType.gen(treeH, treeW);

    // Wrap each tree in a <g> that sways from its own base point
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('forest-tree');
    g.style.transformOrigin = `${x}px ${baseY}px`;
    const delay = -(Math.random() * cfg.swayDuration).toFixed(2);
    g.style.animation = `forest-sway-${layerIndex} ${cfg.swayDuration}s ${delay}s infinite alternate ease-in-out`;

    const transform = `translate(${x},${baseY}) scale(${cfg.scale})`;

    // Trunk (rendered first, behind crown)
    const trunkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    trunkPath.setAttribute('d', tree.trunk);
    trunkPath.setAttribute('fill', trunkColor);
    trunkPath.setAttribute('transform', transform);
    g.appendChild(trunkPath);

    // Crown (rendered on top)
    const crownPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    crownPath.setAttribute('d', tree.crown);
    crownPath.setAttribute('fill', cfg.color);
    crownPath.setAttribute('transform', transform);
    g.appendChild(crownPath);

    svg.appendChild(g);
  }

  wrapper.appendChild(svg);
  container.appendChild(wrapper);
  layerWrappers[layerIndex] = wrapper;
}

export function injectSwayKeyframes(container: HTMLElement): void {
  const style = document.createElement('style');
  let css = '';
  for (let i = 0; i < LAYER_CONFIG.length; i++) {
    const deg = LAYER_CONFIG[i].swayDeg;
    const dir = i % 2 === 0 ? 1 : -1;
    css += `
    @keyframes forest-sway-${i} {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(${deg * dir}deg); }
    }`;
  }
  css += `
    .forest-gust .forest-tree {
      transition: transform 0.3s ease-out !important;
      animation-play-state: paused !important;
    }
    .forest-gust-active .forest-tree {
      transform: rotate(2.5deg) !important;
    }
  `;
  style.textContent = css;
  container.appendChild(style);
}

export function setParallaxOffset(mouseX: number, screenW: number): void {
  const centerOffset = (mouseX - screenW / 2);
  for (let i = 0; i < layerWrappers.length; i++) {
    const wrapper = layerWrappers[i];
    if (!wrapper) continue;
    const offset = centerOffset * LAYER_CONFIG[i].parallax;
    wrapper.style.transform = `translateX(${offset}px)`;
  }
}

export function triggerWindGust(container: HTMLElement): void {
  const wrappers = container.querySelectorAll<HTMLElement>('[data-layer]');
  wrappers.forEach(w => {
    w.classList.add('forest-gust', 'forest-gust-active');
  });
  setTimeout(() => {
    wrappers.forEach(w => {
      w.classList.remove('forest-gust-active');
    });
    setTimeout(() => {
      wrappers.forEach(w => {
        w.classList.remove('forest-gust');
      });
    }, 500);
  }, 300);
}

export { LAYER_CONFIG };
