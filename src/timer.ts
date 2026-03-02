import { TimerState } from './types';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export class Timer {
  private remaining: number;
  private readonly initial: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly onTick: (state: TimerState) => void;
  private readonly onComplete: (state: TimerState) => void;

  constructor(
    totalSeconds: number,
    onTick: (state: TimerState) => void,
    onComplete: (state: TimerState) => void,
  ) {
    this.remaining = totalSeconds;
    this.initial = totalSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  getState(): TimerState {
    const elapsed = this.initial - this.remaining;
    return {
      totalSeconds: this.remaining,
      initialTotalSeconds: this.initial,
      progress: this.initial > 0 ? elapsed / this.initial : 1,
      isComplete: this.remaining <= 0,
      formatted: formatTime(this.remaining),
    };
  }

  start(): void {
    this.onTick(this.getState());
    this.intervalId = setInterval(() => {
      this.remaining--;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.stop();
        const state = this.getState();
        this.onTick(state);
        this.onComplete(state);
        return;
      }
      this.onTick(this.getState());
    }, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
