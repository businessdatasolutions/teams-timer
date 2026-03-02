export type UniverseType = 'nebula' | 'blackhole' | 'crystal' | 'mana' | 'aurora' | 'mycelium' | 'rift' | 'vortex' | 'ghost' | 'earth';

export interface UniverseConfig {
  name: string;
  color: [number, number, number];
  type: UniverseType;
}

export const universes: UniverseConfig[] = [
  { name: 'THE AETHER REACH', color: [255, 0, 255], type: 'nebula' },
  { name: 'CRYSTALLINE VOID', color: [0, 255, 255], type: 'crystal' },
  { name: 'GOLDEN EXPANSE', color: [255, 170, 0], type: 'nebula' },
  { name: 'CHRONO RADIANCE', color: [68, 136, 255], type: 'mana' },
  { name: 'MANA SINGULARITY', color: [255, 68, 0], type: 'blackhole' },
  { name: 'VIOLET MIST', color: [136, 0, 255], type: 'nebula' },
  { name: 'EMERALD AURORA', color: [0, 255, 136], type: 'aurora' },
  { name: 'AMBER MYCELIUM', color: [255, 180, 40], type: 'mycelium' },
  { name: 'CRIMSON RIFT', color: [255, 30, 60], type: 'rift' },
  { name: 'SAPPHIRE MAELSTROM', color: [40, 100, 255], type: 'vortex' },
  { name: 'PHANTOM DRIFT', color: [160, 180, 200], type: 'ghost' },
  { name: 'THE PALE BLUE DOT', color: [70, 130, 230], type: 'earth' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let queue: UniverseConfig[] = [];

export function randomUniverse(exclude?: UniverseConfig): UniverseConfig {
  if (exclude) {
    queue = queue.filter((u) => u !== exclude);
  }
  if (queue.length === 0) {
    queue = shuffle(universes);
    if (exclude && queue[0] === exclude) {
      queue.push(queue.shift()!);
    }
  }
  return queue.shift()!;
}
