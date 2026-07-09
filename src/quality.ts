import type { DensityName, QualityProfile, RenderQualityName } from './types';

type DensityCounts = Pick<
  QualityProfile,
  'particleCount' | 'flowerCount' | 'leafCount' | 'branchCount' | 'outerLineCount'
>;
type RenderSettings = Pick<QualityProfile, 'pixelRatio' | 'targetFps'>;

export const densityProfiles: Record<DensityName, DensityCounts> = {
  low: {
    particleCount: 4200,
    flowerCount: 180,
    leafCount: 260,
    branchCount: 86,
    outerLineCount: 28
  },
  medium: {
    particleCount: 7600,
    flowerCount: 285,
    leafCount: 390,
    branchCount: 124,
    outerLineCount: 46
  },
  high: {
    particleCount: 12800,
    flowerCount: 430,
    leafCount: 560,
    branchCount: 166,
    outerLineCount: 72
  }
};

export const renderProfiles: Record<Exclude<RenderQualityName, 'auto'>, RenderSettings> = {
  low: {
    pixelRatio: 0.85,
    targetFps: 30
  },
  medium: {
    pixelRatio: 1.1,
    targetFps: 42
  },
  high: {
    pixelRatio: 1.25,
    targetFps: 60
  }
};

export function resolveRenderQuality(input: RenderQualityName): Exclude<RenderQualityName, 'auto'> {
  if (input !== 'auto') return input;

  const cores = navigator.hardwareConcurrency || 4;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 720;
  const mobileLike = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || cores <= 6 || smallScreen || mobileLike) return 'low';
  if (cores >= 8 && window.devicePixelRatio <= 2 && window.innerWidth >= 1200) return 'high';
  return 'medium';
}

export function resolveQuality(density: DensityName, render: RenderQualityName): QualityProfile {
  const renderName = resolveRenderQuality(render);
  return {
    densityName: density,
    renderName,
    ...densityProfiles[density],
    ...renderProfiles[renderName]
  };
}
