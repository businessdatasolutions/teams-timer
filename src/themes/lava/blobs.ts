interface BlobConfig {
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

const BLOB_CONFIGS: BlobConfig[] = [
  { size: 200, x: 30, y: 70, duration: 12, delay: 0 },
  { size: 160, x: 60, y: 20, duration: 15, delay: -2 },
  { size: 180, x: 70, y: 80, duration: 10, delay: -5 },
  { size: 140, x: 20, y: 30, duration: 18, delay: -3 },
  { size: 220, x: 50, y: 50, duration: 14, delay: -7 },
  { size: 120, x: 80, y: 40, duration: 16, delay: -1 },
];

export function createBlobContainer(container: HTMLElement): {
  wrapper: HTMLElement;
  blobs: HTMLElement[];
} {
  // Inject keyframes
  const style = document.createElement('style');
  style.textContent = BLOB_CONFIGS.map((_, i) => `
    @keyframes lava-move-${i} {
      0%, 100% { transform: translate(0, 0) scale(1); border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%; }
      25% { transform: translate(${30 + i * 10}px, ${-40 - i * 8}px) scale(1.1); border-radius: 50% 50% 40% 60% / 60% 50% 50% 40%; }
      50% { transform: translate(${-20 + i * 5}px, ${20 + i * 6}px) scale(0.95); border-radius: 60% 40% 50% 50% / 40% 60% 50% 50%; }
      75% { transform: translate(${10 - i * 8}px, ${-10 + i * 4}px) scale(1.05); border-radius: 50% 50% 60% 40% / 50% 40% 40% 60%; }
    }
  `).join('\n');
  container.appendChild(style);

  // Gooey wrapper with blur + contrast filter
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;filter:blur(20px) contrast(30);z-index:1;';

  // Base background for contrast filter to work
  const bg = document.createElement('div');
  bg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:var(--lava-bg,#1a0a2e);';
  wrapper.appendChild(bg);

  const blobs: HTMLElement[] = [];
  for (let i = 0; i < BLOB_CONFIGS.length; i++) {
    const cfg = BLOB_CONFIGS[i];
    const blob = document.createElement('div');
    blob.style.cssText = `
      position: absolute;
      width: ${cfg.size}px; height: ${cfg.size}px;
      left: ${cfg.x}%; top: ${cfg.y}%;
      background: var(--lava-color-${i % 3}, #ff4500);
      border-radius: 50%;
      animation: lava-move-${i} ${cfg.duration}s ${cfg.delay}s infinite ease-in-out;
    `;
    wrapper.appendChild(blob);
    blobs.push(blob);
  }

  container.appendChild(wrapper);
  return { wrapper, blobs };
}
