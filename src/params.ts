import { AppConfig } from './types';

export function parseParams(): AppConfig {
  const params = new URLSearchParams(window.location.search);

  let minutes = parseFloat(params.get('m') ?? '');
  if (isNaN(minutes) || minutes < 0) minutes = 10;

  let seconds = parseFloat(params.get('s') ?? '');
  if (isNaN(seconds) || seconds < 0) seconds = 0;

  const theme = params.get('theme') || 'forest';
  const text = params.get('text') || 'Break Time';
  const totalSeconds = Math.floor(minutes * 60 + seconds);

  let fish = parseInt(params.get('fish') ?? '', 10);
  if (isNaN(fish) || fish < 1) fish = 4;
  if (fish > 20) fish = 20;

  let warp = parseFloat(params.get('warp') ?? '');
  if (isNaN(warp) || warp < 1) warp = 20;

  return { minutes, seconds, theme, text, totalSeconds, fish, warp };
}
