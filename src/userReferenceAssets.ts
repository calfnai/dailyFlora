export const USER_REFERENCE_ASSET_CONTRACT_VERSION = '1.0' as const;

export interface UserReferenceImageOptions {
  maxSourceBytes: number;
  referenceMaxEdge: number;
  referenceQuality: number;
  thumbnailMaxEdge: number;
  thumbnailQuality: number;
  maxReferenceBytes: number;
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

export const defaultUserReferenceImageOptions: Readonly<UserReferenceImageOptions> = Object.freeze({
  maxSourceBytes: 20 * 1024 * 1024,
  referenceMaxEdge: 2048,
  referenceQuality: 0.86,
  thumbnailMaxEdge: 320,
  thumbnailQuality: 0.8,
  maxReferenceBytes: 1_500_000
});

function normalizeOptions(options?: Partial<UserReferenceImageOptions>): UserReferenceImageOptions {
  const normalized = { ...defaultUserReferenceImageOptions, ...options };
  for (const [name, value] of Object.entries(normalized)) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} 必须为正数。`);
  }
  if (normalized.referenceQuality > 1 || normalized.thumbnailQuality > 1) {
    throw new Error('WebP 质量必须在 0 到 1 之间。');
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
        reject(new Error('当前浏览器无法把图片编码为 WebP。'));
        return;
      }
      resolve(blob);
    }, 'image/webp', quality);
  });
}

async function renderWebp(image: ImageBitmap, maxEdge: number, quality: number): Promise<PreparedWebpAsset> {
  const dimensions = scaledDimensions(image.width, image.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('浏览器无法创建图片处理画布。');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
  const blob = await canvasToWebp(canvas, quality);
  canvas.width = 1;
  canvas.height = 1;
  return { blob, bytes: blob.size, height: dimensions.height, mimeType: 'image/webp', width: dimensions.width };
}

export async function prepareUserReferenceAssets(
  file: File,
  options?: Partial<UserReferenceImageOptions>
): Promise<PreparedUserReferenceAssets> {
  const normalized = normalizeOptions(options);
  if (!file.type.startsWith('image/')) throw new Error('请选择浏览器可识别的图片文件。');
  if (file.size > normalized.maxSourceBytes) throw new Error('源图片超过 20MB。');

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('浏览器无法识别这张图片，请转换为 JPEG、PNG 或 WebP 后重试。');
  }

  try {
    const [reference, thumbnail] = await Promise.all([
      renderWebp(image, normalized.referenceMaxEdge, normalized.referenceQuality),
      renderWebp(image, normalized.thumbnailMaxEdge, normalized.thumbnailQuality)
    ]);
    if (reference.bytes > normalized.maxReferenceBytes) {
      throw new Error('图片压缩后仍超过 1.5MB，请换一张构图更简单或尺寸更小的图片。');
    }
    return { contractVersion: USER_REFERENCE_ASSET_CONTRACT_VERSION, reference, thumbnail };
  } finally {
    image.close();
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(reader.error || new Error('读取压缩图片失败。')));
    reader.readAsDataURL(blob);
  });
}
