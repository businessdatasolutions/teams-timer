import { parseParams } from './params';
import { Timer } from './timer';
import { loadTheme } from './theme-registry';

async function boot() {
  const config = parseParams();
  const container = document.getElementById('app')!;

  const ThemeClass = await loadTheme(config.theme);
  const theme = new ThemeClass(container);
  theme.init(config);
  theme.resize(window.innerWidth, window.innerHeight);

  window.addEventListener('resize', () => {
    theme.resize(window.innerWidth, window.innerHeight);
  });

  const timer = new Timer(
    config.totalSeconds,
    () => {},
    () => theme.onComplete(),
  );

  let lastTime = performance.now();

  function loop(now: number) {
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    theme.update(dt, timer.getState());
    theme.render(theme['ctx']);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
  timer.start();
}

boot();
