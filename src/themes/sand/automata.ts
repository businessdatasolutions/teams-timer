// Cellular automata sand simulation using double-buffered Uint8Array grid
// 0 = empty, 1+ = sand color index

export class SandGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;
  private gridA: Uint8Array;
  private gridB: Uint8Array;
  private useA = true;

  constructor(w: number, h: number, cellSize = 2) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(w / cellSize);
    this.rows = Math.ceil(h / cellSize);
    const len = this.cols * this.rows;
    this.gridA = new Uint8Array(len);
    this.gridB = new Uint8Array(len);
  }

  private idx(col: number, row: number): number {
    return row * this.cols + col;
  }

  get(col: number, row: number): number {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 1; // Treat OOB as solid
    return this.read()[this.idx(col, row)];
  }

  set(col: number, row: number, val: number): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.read()[this.idx(col, row)] = val;
  }

  private read(): Uint8Array {
    return this.useA ? this.gridA : this.gridB;
  }

  private write(): Uint8Array {
    return this.useA ? this.gridB : this.gridA;
  }

  setObstacle(col: number, row: number): void {
    this.set(col, row, 255); // Special obstacle value
  }

  step(): void {
    const src = this.read();
    const dst = this.write();
    dst.set(src); // Copy current state

    // Iterate bottom-up so sand falls correctly
    for (let row = this.rows - 2; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const i = this.idx(col, row);
        const val = src[i];
        if (val === 0 || val === 255) continue; // Empty or obstacle

        const below = this.idx(col, row + 1);
        if (row + 1 < this.rows && dst[below] === 0) {
          // Fall down
          dst[below] = val;
          dst[i] = 0;
        } else {
          // Try diagonal
          const leftOk = col > 0 && row + 1 < this.rows && dst[this.idx(col - 1, row + 1)] === 0;
          const rightOk = col < this.cols - 1 && row + 1 < this.rows && dst[this.idx(col + 1, row + 1)] === 0;

          if (leftOk && rightOk) {
            const dir = Math.random() < 0.5 ? -1 : 1;
            dst[this.idx(col + dir, row + 1)] = val;
            dst[i] = 0;
          } else if (leftOk) {
            dst[this.idx(col - 1, row + 1)] = val;
            dst[i] = 0;
          } else if (rightOk) {
            dst[this.idx(col + 1, row + 1)] = val;
            dst[i] = 0;
          }
          // else: stuck in place
        }
      }
    }

    this.useA = !this.useA;
  }

  renderToImageData(imageData: ImageData): void {
    const data = imageData.data;
    const grid = this.read();
    const COLORS: [number, number, number][] = [
      [0, 0, 0],         // 0: empty (transparent, bg shows through)
      [220, 195, 140],   // 1: light sand
      [200, 175, 120],   // 2: medium sand
      [180, 155, 100],   // 3: dark sand
      [240, 215, 160],   // 4: bright sand
    ];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const val = grid[this.idx(col, row)];
        if (val === 0) continue;

        const color = val === 255 ? [40, 40, 40] : (COLORS[val] || COLORS[1]);
        // Write cellSize x cellSize pixels
        for (let dy = 0; dy < this.cellSize; dy++) {
          for (let dx = 0; dx < this.cellSize; dx++) {
            const px = col * this.cellSize + dx;
            const py = row * this.cellSize + dy;
            if (px >= imageData.width || py >= imageData.height) continue;
            const pi = (py * imageData.width + px) * 4;
            data[pi] = color[0];
            data[pi + 1] = color[1];
            data[pi + 2] = color[2];
            data[pi + 3] = 255;
          }
        }
      }
    }
  }
}
