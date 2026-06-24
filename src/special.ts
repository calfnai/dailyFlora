import { herJanuarySkyReference } from './specialBouquetReference';
import { getFlowerPlanById } from './flowerPlans';
import type { DailyBouquetSpec, SpecialBouquetReference } from './types';

export const specialReferences: Record<string, SpecialBouquetReference> = {
  ngc2787: herJanuarySkyReference
};

export function readSpecialId(search = window.location.search) {
  const params = new URLSearchParams(search);
  const id = params.get('special');
  return id && specialReferences[id] ? id : null;
}

export function withBasePath(path: string) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\/+/, '')}`;
}

export function createSpecialSpec(reference: SpecialBouquetReference, dateOverride?: string): DailyBouquetSpec {
  return {
    seed: reference.seed,
    dateLabel: dateOverride || reference.date,
    theme: reference.theme,
    branchDensity: 1.28 * reference.shape.airySprayBias,
    sparkleDensity: 1.36,
    flowerDensity: 1.32 * reference.shape.centralFullness,
    leafDensity: 0.42,
    rotationSpeed: 0.025,
    asymmetry: reference.shape.asymmetry,
    haloLift: reference.shape.verticalLift,
    flowerPlan: getFlowerPlanById('fairy-violet-air')!,
    special: reference
  };
}
