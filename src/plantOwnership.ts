import type * as THREE from 'three';
import type { RealisticFlowerId } from './realisticFlowerForms';

export type LeafMode = 'attached' | 'none';
export type LeafArrangement = 'alternate' | 'opposite' | 'whorled' | 'basal' | 'unresolved';
export type FoliageProfileId =
  | 'unresolved'
  | 'temporary-legacy:foliage-grass-branch'
  | `temporary-legacy:${string}`
  | `confirmed:${string}`;

export interface StemFoliageProfile {
  foliageProfile: FoliageProfileId;
  leafMode: LeafMode;
  leafArrangement: LeafArrangement;
  status: 'confirmed' | 'unresolved' | 'temporary-legacy';
}

export interface PlantStemInstance extends StemFoliageProfile {
  stemId: string;
  plantMemberId: string;
  source: 'realistic-flower' | 'temporary-legacy';
  curvePoints: readonly THREE.Vector3[];
}

export interface LeafInstanceRecord {
  leafId: string;
  stemId: string;
  foliageProfile: FoliageProfileId;
  leafArrangement: LeafArrangement;
  nodeIndex: number;
  nodePosition: readonly [number, number, number];
  growthStage: number;
  matrix: readonly number[];
  color: string;
}

export interface FlowerAuditRecord {
  flowerId: string;
  placementOrder: number;
  matrix: readonly number[];
  colors: readonly string[];
}

export interface LeafOwnershipAudit {
  realisticFlowerLeafCount: number;
  temporaryLegacyStemCount: number;
  beforeLooseLeafCount: number;
  beforeTotalLeafCount: number;
  afterTotalLeafCount: number;
  totalLeafDelta: number;
  orphanLeafCount: number;
  mixedProfileStemCount: number;
  mixedArrangementStemCount: number;
  unresolvedGeneratedLeafCount: number;
  detachedLeafNodeCount: number;
  flowerCount: number;
  flowerRecords: readonly FlowerAuditRecord[];
}

export const unresolvedFoliageProfile: StemFoliageProfile = {
  foliageProfile: 'unresolved',
  leafMode: 'none',
  leafArrangement: 'unresolved',
  status: 'unresolved'
};

export const temporaryLegacyFoliageProfile: StemFoliageProfile = {
  foliageProfile: 'temporary-legacy:foliage-grass-branch',
  leafMode: 'attached',
  leafArrangement: 'alternate',
  status: 'temporary-legacy'
};

export const realisticFlowerIds: readonly RealisticFlowerId[] = [
  'daisy',
  'chamomile',
  'gerbera',
  'sunflower',
  'anemone',
  'cosmos',
  'dahlia',
  'rose',
  'ranunculus',
  'camellia',
  'peony',
  'pompon-mum',
  'tulip',
  'narcissus',
  'phalaenopsis',
  'calla',
  'delphinium',
  'snapdragon',
  'hyacinth',
  'foxtail-lily',
  'liatris',
  'lace-flower',
  'hydrangea',
  'babys-breath',
  'rice-flower'
];

export const realisticFlowerFoliageStatus: Readonly<Record<RealisticFlowerId, StemFoliageProfile>> =
  Object.freeze(Object.fromEntries(
    realisticFlowerIds.map((id) => [id, Object.freeze({ ...unresolvedFoliageProfile })])
  ) as Record<RealisticFlowerId, StemFoliageProfile>);

export function validateLeafOwnership(stems: readonly PlantStemInstance[], leaves: readonly LeafInstanceRecord[]) {
  const stemsById = new Map(stems.map((stem) => [stem.stemId, stem]));
  const profilesByStem = new Map<string, Set<FoliageProfileId>>();
  const arrangementsByStem = new Map<string, Set<LeafArrangement>>();
  let orphanLeafCount = 0;
  let unresolvedGeneratedLeafCount = 0;
  let detachedLeafNodeCount = 0;

  const pointToSegmentDistance = (
    point: readonly [number, number, number],
    start: THREE.Vector3,
    end: THREE.Vector3
  ) => {
    const segment = [end.x - start.x, end.y - start.y, end.z - start.z] as const;
    const offset = [point[0] - start.x, point[1] - start.y, point[2] - start.z] as const;
    const lengthSq = segment[0] ** 2 + segment[1] ** 2 + segment[2] ** 2;
    const t = lengthSq > 0
      ? Math.max(0, Math.min(1, (offset[0] * segment[0] + offset[1] * segment[1] + offset[2] * segment[2]) / lengthSq))
      : 0;
    const dx = point[0] - (start.x + segment[0] * t);
    const dy = point[1] - (start.y + segment[1] * t);
    const dz = point[2] - (start.z + segment[2] * t);
    return Math.hypot(dx, dy, dz);
  };

  leaves.forEach((leaf) => {
    const stem = stemsById.get(leaf.stemId);
    if (!stem) {
      orphanLeafCount += 1;
      return;
    }
    const profiles = profilesByStem.get(leaf.stemId) ?? new Set<FoliageProfileId>();
    profiles.add(leaf.foliageProfile);
    profilesByStem.set(leaf.stemId, profiles);
    const arrangements = arrangementsByStem.get(leaf.stemId) ?? new Set<LeafArrangement>();
    arrangements.add(leaf.leafArrangement);
    arrangementsByStem.set(leaf.stemId, arrangements);
    if (stem.leafMode === 'none' || stem.foliageProfile === 'unresolved') {
      unresolvedGeneratedLeafCount += 1;
    }
    const nearestStemDistance = stem.curvePoints.length > 1
      ? Math.min(...stem.curvePoints.slice(0, -1).map((start, index) =>
        pointToSegmentDistance(leaf.nodePosition, start, stem.curvePoints[index + 1])
      ))
      : Number.POSITIVE_INFINITY;
    if (nearestStemDistance > 0.02) detachedLeafNodeCount += 1;
  });

  return {
    orphanLeafCount,
    unresolvedGeneratedLeafCount,
    detachedLeafNodeCount,
    mixedProfileStemCount: [...profilesByStem.values()].filter((profiles) => profiles.size > 1).length,
    mixedArrangementStemCount: [...arrangementsByStem.values()].filter((arrangements) => arrangements.size > 1).length
  };
}
