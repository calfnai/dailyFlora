import { createRng, todayKey } from './random';
import { themes } from './themes';
import type { DailyBouquetSpec } from './types';

export function readParams() {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date') || todayKey();
  const seed = params.get('seed') || date;
  const quality = params.get('quality') || 'auto';
  return { date, seed, quality };
}

export function createDailySpec(dateLabel: string, seed: string): DailyBouquetSpec {
  const rng = createRng(`daily-flora:${seed}`);
  const theme = themes[Math.floor(rng.value() * themes.length)];

  return {
    seed,
    dateLabel,
    theme,
    branchDensity: rng.range(0.85, 1.25) * theme.densityBias,
    sparkleDensity: rng.range(0.75, 1.4),
    flowerDensity: rng.range(0.8, 1.35) * theme.densityBias,
    leafDensity: rng.range(0.75, 1.25),
    rotationSpeed: rng.range(0.045, 0.085),
    asymmetry: rng.range(0.08, 0.26),
    haloLift: rng.range(0.05, 0.36) * theme.verticalBias
  };
}
