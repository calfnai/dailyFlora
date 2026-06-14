export type QualityName = 'auto' | 'low' | 'medium' | 'high';

export interface QualityProfile {
  name: Exclude<QualityName, 'auto'>;
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
