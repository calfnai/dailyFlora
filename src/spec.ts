import { createRng, todayKey } from './random';
import { themes } from './themes';
import { createFlowerPlan } from './flowerPlans';
import type { DailyBouquetSpec } from './types';

const defaultThemeId = 'dopamine-field';

export function readParams() {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date') || todayKey();
  const seed = params.get('seed') || date;
  const density = params.get('density') || params.get('quality') || 'medium';
  const render = params.get('render') || 'auto';
  const theme = params.get('theme') || defaultThemeId;
  return { date, seed, density, render, theme };
}

export function createDailySpec(dateLabel: string, seed: string, themeId = defaultThemeId): DailyBouquetSpec {
  const rng = createRng(`daily-flora:${seed}`);
  const theme =
    themeId === 'random'
      ? themes[Math.floor(rng.value() * themes.length)]
      : themes.find((item) => item.id === themeId) || themes.find((item) => item.id === defaultThemeId) || themes[0];

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
    haloLift: rng.range(0.05, 0.36) * theme.verticalBias,
    flowerPlan: createFlowerPlan(seed, theme)
  };
}
