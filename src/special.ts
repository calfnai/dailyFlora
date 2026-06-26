import { herJanuarySkyReference, herJanuarySkyReferenceV2, herJanuarySkyReferenceV3 } from './specialBouquetReference';
import { getFlowerPlanById } from './flowerPlans';
import type { DailyBouquetSpec, SpecialBouquetReference } from './types';

export const specialReferences: Record<string, SpecialBouquetReference> = {
  ngc2787: herJanuarySkyReference,
  ngc2787v2: herJanuarySkyReferenceV2,
  ngc2787v3: herJanuarySkyReferenceV3
};

export function readSpecialId(search = window.location.search) {
  const pathname = window.location.pathname.replace(/\/+$/, '');
  for (const [id, reference] of Object.entries(specialReferences)) {
    if (reference.routePath && pathname.endsWith(`/${reference.routePath}`)) return id;
  }

  const params = new URLSearchParams(search);
  const id = params.get('special');
  return id && specialReferences[id] ? id : null;
}

export function specialPathname(reference: SpecialBouquetReference) {
  const routePath = reference.routePath || 'special0629';
  const pathname = window.location.pathname;
  const match = pathname.match(/^(.*?\/)special0629(?:-v\d+)?(?:\/.*)?$/);
  if (match) return `${match[1]}${routePath}`;
  const basePath = pathname.endsWith('/') ? pathname : pathname.replace(/\/[^/]*$/, '/');
  return `${basePath}${routePath}`;
}

export function withBasePath(path: string) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\/+/, '')}`;
}

export function createSpecialSpec(reference: SpecialBouquetReference, dateOverride?: string): DailyBouquetSpec {
  const flowerPlan = getFlowerPlanById(reference.flowerPlanId || 'her-january-sky-memory');

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
    flowerPlan: flowerPlan || getFlowerPlanById('her-january-sky-memory')!,
    special: reference
  };
}
