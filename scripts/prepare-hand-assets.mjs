import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const repoRoot = process.cwd();
const distRoot = path.join(repoRoot, 'dist');
const chunkSize = 2 * 1024 * 1024;
const assets = [
  'models/gesture_recognizer.task',
  'mediapipe/wasm/vision_wasm_internal.wasm',
  'mediapipe/wasm/vision_wasm_module_internal.wasm',
  'mediapipe/wasm/vision_wasm_nosimd_internal.wasm'
];

const manifest = {
  version: 1,
  encoding: 'gzip',
  assets: {}
};

for (const relativePath of assets) {
  const sourcePath = path.join(distRoot, relativePath);
  if (!fs.existsSync(sourcePath)) throw new Error(`Hand-control asset is missing: ${relativePath}`);

  const source = fs.readFileSync(sourcePath);
  const chunks = [];
  for (let offset = 0, index = 0; offset < source.length; offset += chunkSize, index += 1) {
    const outputRelativePath = `hand-assets/${relativePath.replaceAll('/', '__')}.part${index}.gz`;
    const outputPath = path.join(distRoot, outputRelativePath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, gzipSync(source.subarray(offset, Math.min(source.length, offset + chunkSize)), { level: 9 }));
    chunks.push(outputRelativePath);
  }

  manifest.assets[relativePath] = {
    bytes: source.length,
    chunks
  };
}

fs.writeFileSync(path.join(distRoot, 'hand-assets.json'), `${JSON.stringify(manifest, null, 2)}\n`);
