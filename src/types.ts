export type DensityName = 'low' | 'medium' | 'high';
export type RenderQualityName = 'auto' | 'low' | 'medium' | 'high';

export interface QualityProfile {
  densityName: DensityName;
  renderName: Exclude<RenderQualityName, 'auto'>;
  particleCount: number;
  flowerCount: number;
  leafCount: number;
  branchCount: number;
  outerLineCount: number;
  pixelRatio: number;
  targetFps: number;
}

export type FlowerTypeId =
  | 'lowPolyMass'
  | 'fivePetal'
  | 'rose'
  | 'camelliaPeony'
  | 'chamomile'
  | 'orchid'
  | 'snapdragon'
  | 'hyacinth'
  | 'liatris'
  | 'hydrangea'
  | 'pompon'
  | 'bellFruit';

export type FlowerPlanRole = 'main' | 'secondary' | 'line' | 'cluster' | 'fruit' | 'filler';

export interface FlowerPlanItem {
  typeId: FlowerTypeId;
  cn: string;
  en: string;
  role: FlowerPlanRole;
  share: number;
  scale: number;
  placement: 'center' | 'outer' | 'high' | 'low' | 'spray' | 'mixed';
  note: string;
}

export interface FlowerPlan {
  id: string;
  cnName: string;
  enName: string;
  reference: string;
  silhouette: string;
  avoid: string;
  items: FlowerPlanItem[];
}

export interface BouquetTheme {
  id: string;
  name: string;
  palette: string[];
  leafPalette: string[];
  stem: string;
  background: string;
  floor: string;
  glow: string;
  densityBias: number;
  verticalBias: number;
  wildness: number;
  branchBias?: number;
  leafBias?: number;
  flowerBias?: number;
  outerLineBias?: number;
}

export interface SpecialBouquetReference {
  id: string;
  title: string;
  versionLabel?: string;
  routePath?: string;
  flowerPlanId?: string;
  date: string;
  seed: string;
  theme: BouquetTheme;
  hubbleImagePath: string;
  audioPath: string;
  visualAnalysis: {
    mainColors: string[];
    accentColors: string[];
    flowerShapes: string[];
    silhouette: string;
    wrapping: string;
    emotionalTone: string;
    particleTranslation: string;
  };
  shape: {
    radius: number;
    height: number;
    verticalLift: number;
    asymmetry: number;
    airySprayBias: number;
    centralFullness: number;
    stemVisibility: number;
  };
  bloomScale: {
    small: number;
    medium: number;
    large: number;
    largeBias: number;
  };
  wrapping: {
    color: string;
    edgeColor: string;
    ribbonColor: string;
    opacity: number;
  };
  cosmic: {
    starColors: string[];
    dustColors: string[];
    galaxyTint: string;
    warmCore: string;
  };
}

export interface DailyBouquetSpec {
  seed: string;
  dateLabel: string;
  theme: BouquetTheme;
  branchDensity: number;
  sparkleDensity: number;
  flowerDensity: number;
  leafDensity: number;
  rotationSpeed: number;
  asymmetry: number;
  haloLift: number;
  flowerPlan: FlowerPlan;
  special?: SpecialBouquetReference;
}

export interface InspirationEntry {
  id: string;
  creatorId: string;
  creatorName: string;
  sourceUrl: string;
  title: string;
  observedAt: string;
  colorNotes: string[];
  spatialNotes: string[];
  materialNotes: string[];
  parameterSuggestions: string[];
  status: 'pending-confirmation' | 'accepted' | 'archived';
}
