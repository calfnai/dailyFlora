import { createRng, todayKey } from './random';
import { themes } from './themes';
import type { DailyBouquetSpec } from './types';

export function readParams() {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date') || todayKey();
  const seed = params.get('seed') || date;
  const density = params.get('density') || params.get('quality') || 'medium';
  const render = params.get('render') || 'auto';
  const theme = params.get('theme') || 'dopamine-field';
  return { date, seed, density, render, theme };
}

export function createDailySpec(dateLabel: string, seed: string, themeId?: string): DailyBouquetSpec {
  const rng = createRng(`daily-flora:${seed}`);
  const requestedTheme = themes.find((entry) => entry.id === themeId);
  const theme = requestedTheme || themes[Math.floor(rng.value() * themes.length)];

  return {
    seed,
    dateLabel,
    theme,
    branchDensity: rng.range(0.85, 1.25) * theme.densityBias * (theme.branchBias ?? 1),
    sparkleDensity: rng.range(0.75, 1.4),
    flowerDensity: rng.range(0.8, 1.35) * theme.densityBias * (theme.flowerBias ?? 1),
    leafDensity: rng.range(0.75, 1.25) * (theme.leafBias ?? 1),
    rotationSpeed: rng.range(0.045, 0.085),
    asymmetry: rng.range(0.08, 0.26),
    haloLift: rng.range(0.05, 0.36) * theme.verticalBias
  };
}
