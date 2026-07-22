import type { DailyBouquetSpec } from './types';

export const productVersion = '0.12E' as const;

export type AuthProvider = 'local-mvp' | 'github' | 'apple' | 'wechat' | 'email';
export type UserStatus = 'active' | 'invited' | 'paused' | 'deleted';
export type PlanCode = 'visitor' | 'member' | 'supporter' | 'patron' | 'internal';
export type BouquetVisibility = 'private' | 'unlisted' | 'public';
export type SocialTarget =
  | 'xiaohongshu'
  | 'weibo'
  | 'wechat'
  | 'x'
  | 'threads'
  | 'facebook'
  | 'system-share'
  | 'copy-link'
  | 'download';

export interface LegalConsent {
  termsVersion: string;
  privacyVersion: string;
  eulaVersion?: string;
  consentedAt: string;
}

export interface UserEntitlements {
  dailyPersonalGenerations: number;
  dailyRevisionsPerBouquet: number;
  canUploadImages: boolean;
  canKeepPrivateBouquets: boolean;
}

export interface AestheticProfile {
  profileId: string;
  userId: string;
  tags: string[];
  colorPreferences: string[];
  materialPreferences: string[];
  negativePreferences: string[];
  updatedAt: string;
}

export interface DailyFloraUser {
  userId: string;
  displayName: string;
  handle?: string;
  emailHash?: string;
  authProvider: AuthProvider;
  status: UserStatus;
  plan: PlanCode;
  entitlements: UserEntitlements;
  aestheticProfileId?: string;
  legalConsent?: LegalConsent;
  createdAt: string;
  lastSeenAt?: string;
}

export interface BouquetRecord {
  bouquetId: string;
  kind: 'daily' | 'personal';
  dateKey?: string;
  ownerUserId?: string;
  seed: string;
  spec: DailyBouquetSpec;
  previewImageUrl?: string;
  shareImageUrl?: string;
  visibility: BouquetVisibility;
  createdAt: string;
}

export interface FavoriteRecord {
  favoriteId: string;
  userId: string;
  bouquetId: string;
  savedAt: string;
  note?: string;
}

export interface ShareRecord {
  shareId: string;
  userId?: string;
  bouquetId: string;
  target: SocialTarget;
  sharedAt: string;
  shareUrl?: string;
  copiedText?: string;
}

export interface PersonalInputRecord {
  inputId: string;
  userId: string;
  inputKind: 'text' | 'image' | 'text-image';
  text?: string;
  imageAssetId?: string;
  derivedAestheticTags: string[];
  generatedBouquetId?: string;
  revisionOfInputId?: string;
  dailyGenerationKey: string;
  createdAt: string;
}

export type UserReferenceGenerationStatus = 'recognizing' | 'ready' | 'failed';
export type UserReferenceStorageProvider = 'vercel-blob';

export interface StoredUserReferenceWebp {
  assetId: string;
  storageProvider: UserReferenceStorageProvider;
  storageKey: string;
  mimeType: 'image/webp';
  width: number;
  height: number;
  bytes: number;
}

export interface UserReferenceRecognitionResult {
  summary: string;
  confidence?: number;
  modelVersion: string;
  completedAt: string;
}

export interface UserReferenceComposition {
  density?: number;
  openness?: number;
  asymmetry?: number;
  depth?: number;
  lineDirection?: string;
  notes?: string[];
}

/**
 * One append-only user generation record. System flower definitions remain in
 * the shared DailyFlora library and must never be copied into this record.
 */
interface UserReferenceGenerationRecordBase {
  recordId: string;
  userId: string;
  referenceAsset: StoredUserReferenceWebp;
  thumbnailAsset: StoredUserReferenceWebp;
  matcherVersion: string;
  systemVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecognizingUserReferenceGenerationRecord extends UserReferenceGenerationRecordBase {
  status: 'recognizing';
}

export interface ReadyUserReferenceGenerationRecord extends UserReferenceGenerationRecordBase {
  status: 'ready';
  recognitionResult: UserReferenceRecognitionResult;
  palette: string[];
  composition: UserReferenceComposition;
  seed: string;
  renderParams: Readonly<Record<string, unknown>>;
}

export interface FailedUserReferenceGenerationRecord extends UserReferenceGenerationRecordBase {
  status: 'failed';
  failureCode: string;
}

export type UserReferenceGenerationRecord =
  | RecognizingUserReferenceGenerationRecord
  | ReadyUserReferenceGenerationRecord
  | FailedUserReferenceGenerationRecord;
