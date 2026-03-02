export interface AppConfig {
  minutes: number;
  seconds: number;
  theme: string;
  text: string;
  totalSeconds: number;
  fish: number;
  warp: number;
}

export interface TimerState {
  totalSeconds: number;
  initialTotalSeconds: number;
  progress: number;
  isComplete: boolean;
  formatted: string;
}
