import type { DailyBouquetSpec } from './types';

/** Only the versioned, bounded rendering fields cross the public iframe boundary. */
export function applyGeneratedBouquet(spec: DailyBouquetSpec, params: URLSearchParams): DailyBouquetSpec {
  const colors = (params.get('colors') || '').split(',').filter(color => /^#[0-9a-f]{6}$/i.test(color)).slice(0, 8);
  if (!colors.length) return spec;
  const number = (key: string, min: number, max: number, fallback: number) => {
    const value = Number(params.get(key));
    return params.has(key) && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  };
  const spread = number('spread', 0.6, 1.5, 1);
  const height = number('height', 0.7, 1.4, 1);
  const airiness = number('airiness', 0, 1, 0.5);
  return {
    ...spec,
    theme: { ...spec.theme, palette: colors, verticalBias: spec.theme.verticalBias * height },
    flowerDensity: spec.flowerDensity * (1.2 - airiness * 0.5),
    compositionTuning: { ...spec.compositionTuning, radialSpread: spread, centerSpread: spread, spikeScale: height }
  };
}
