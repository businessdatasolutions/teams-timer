import { SandGrid } from './automata';

export class SandEmitter {
  private grainsPerSecond: number;
  private accumulator = 0;
  private emitCol: number;
  private emitRow = 0;

  constructor(totalGrains: number, totalSeconds: number, gridCols: number) {
    this.grainsPerSecond = totalSeconds > 0 ? totalGrains / totalSeconds : totalGrains;
    this.emitCol = Math.floor(gridCols / 2);
  }

  update(dt: number, grid: SandGrid): void {
    this.accumulator += (dt / 1000) * this.grainsPerSecond;

    while (this.accumulator >= 1) {
      this.accumulator--;
      // Emit with slight horizontal spread
      const col = this.emitCol + Math.floor((Math.random() - 0.5) * 6);
      const colorIndex = 1 + Math.floor(Math.random() * 4); // 1-4
      grid.set(col, this.emitRow, colorIndex);
    }
  }
}
