import type { QualityName, QualityProfile } from './types';

export const qualityProfiles: Record<Exclude<QualityName, 'auto'>, QualityProfile> = {
  low: {
    name: 'low',
    particleCount: 4200,
    flowerCount: 180,
    leafCount: 260,
    branchCount: 86,
    outerLineCount: 28,
    pixelRatio: 0.9,
    targetFps: 30
  },
  medium: {
    name: 'medium',
    particleCount: 7600,
    flowerCount: 285,
    leafCount: 390,
    branchCount: 124,
    outerLineCount: 46,
    pixelRatio: 1.1,
    targetFps: 40
  },
  high: {
    name: 'high',
    particleCount: 12800,
    flowerCount: 430,
    leafCount: 560,
    branchCount: 166,
    outerLineCount: 72,
    pixelRatio: 1.35,
    targetFps: 50
  }
};

export function resolveQuality(input: QualityName): QualityProfile {
  if (input !== 'auto') {
    return qualityProfiles[input] ?? qualityProfiles.medium;
  }

  const cores = navigator.hardwareConcurrency || 4;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 720;
  const mobileLike = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || cores <= 6 || smallScreen || mobileLike) {
    return qualityProfiles.low;
  }

  if (cores >= 8 && window.devicePixelRatio <= 2 && window.innerWidth >= 1200) {
    return qualityProfiles.high;
  }

  return qualityProfiles.medium;
}
