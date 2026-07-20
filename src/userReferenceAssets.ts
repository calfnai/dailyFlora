export const USER_REFERENCE_ASSET_CONTRACT_VERSION = '1.0' as const;

export interface UserReferenceImageOptions {
  maxSourceBytes: number;
  referenceMaxEdge: number;
  referenceQuality: number;
  thumbnailMaxEdge: number;
  thumbnailQuality: number;
}

export interface PreparedWebpAsset {
  blob: Blob;
  bytes: number;
  height: number;
  mimeType: 'image/webp';
  width: number;
}

export interface PreparedUserReferenceAssets {
  contractVersion: typeof USER_REFERENCE_ASSET_CONTRACT_VERSION;
  reference: PreparedWebpAsset;
  thumbnail: PreparedWebpAsset;
}

export interface UserReferenceStorageKeys {
  reference: string;
  thumbnail: string;
}

export const defaultUserReferenceImageOptions: Readonly<UserReferenceImageOptions> = Object.freeze({
  maxSourceBytes: 20 * 1024 * 1024,
  referenceMaxEdge: 2048,
  referenceQuality: 0.86,
  thumbnailMaxEdge: 320,
  thumbnailQuality: 0.8
});

function assertSafeStorageSegment(value: string, label: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`${label} must contain only letters, numbers, underscores, or hyphens.`);
  }
}

export function createUserReferenceStorageKeys(userId: string, recordId: string): UserReferenceStorageKeys {
  assertSafeStorageSegment(userId, 'userId');
  assertSafeStorageSegment(recordId, 'recordId');
  const base = `users/${userId}/references/${recordId}`;
  return {
    reference: `${base}/reference.webp`,
    thumbnail: `${base}/thumbnail.webp`
  };
}

function normalizeOptions(options?: Partial<UserReferenceImageOptions>): UserReferenceImageOptions {
  const normalized = { ...defaultUserReferenceImageOptions, ...options };
  for (const [name, value] of Object.entries(normalized)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a positive finite number.`);
    }
  }
  if (normalized.referenceQuality > 1 || normalized.thumbnailQuality > 1) {
    throw new Error('WebP quality must be between 0 and 1.');
  }
  return normalized;
}

function scaledDimensions(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== 'image/webp') {
        reject(new Error('This browser could not encode the image as WebP.'));
        return;
      }
      resolve(blob);
    }, 'image/webp', quality);
  });
}

async function renderWebp(
  image: ImageBitmap,
  maxEdge: number,
  quality: number
): Promise<PreparedWebpAsset> {
  const dimensions = scaledDimensions(image.width, image.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('The browser could not create a 2D image context.');
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
  const blob = await canvasToWebp(canvas, quality);
  canvas.width = 1;
  canvas.height = 1;
  return {
    blob,
    bytes: blob.size,
    height: dimensions.height,
    mimeType: 'image/webp',
    width: dimensions.width
  };
}

export async function prepareUserReferenceAssets(
  file: File,
  options?: Partial<UserReferenceImageOptions>
): Promise<PreparedUserReferenceAssets> {
  const normalized = normalizeOptions(options);
  if (!file.type.startsWith('image/')) {
    throw new Error('The selected file is not an image.');
  }
  if (file.size > normalized.maxSourceBytes) {
    throw new Error(`The selected image exceeds the ${normalized.maxSourceBytes}-byte source limit.`);
  }

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('The browser could not decode the selected image. Convert it to JPEG, PNG, or WebP and try again.');
  }

  try {
    const [reference, thumbnail] = await Promise.all([
      renderWebp(image, normalized.referenceMaxEdge, normalized.referenceQuality),
      renderWebp(image, normalized.thumbnailMaxEdge, normalized.thumbnailQuality)
    ]);
    return {
      contractVersion: USER_REFERENCE_ASSET_CONTRACT_VERSION,
      reference,
      thumbnail
    };
  } finally {
    image.close();
  }
}
