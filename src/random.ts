export interface Rng {
  value(): number;
  range(min: number, max: number): number;
  integer(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  sign(): number;
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: string): Rng {
  let state = hashString(seed) || 1;

  const value = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    value,
    range: (min, max) => min + (max - min) * value(),
    integer: (min, max) => Math.floor(min + (max - min + 1) * value()),
    pick: (items) => items[Math.floor(value() * items.length)],
    sign: () => (value() > 0.5 ? 1 : -1)
  };
}

export function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
