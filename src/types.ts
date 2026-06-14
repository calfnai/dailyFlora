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
