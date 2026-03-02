import { ThemeConstructor } from './base-theme';

const registry: Record<string, () => Promise<{ default: ThemeConstructor }>> = {
  forest: () => import('./themes/forest/index'),
  lava: () => import('./themes/lava/index'),
  koi: () => import('./themes/koi/index'),
  cosmos: () => import('./themes/cosmos/index'),
  sand: () => import('./themes/sand/index'),
  earth: () => import('./themes/earth/index'),
};

export async function loadTheme(name: string): Promise<ThemeConstructor> {
  const loader = registry[name] ?? registry['forest'];
  const mod = await loader();
  return mod.default;
}
