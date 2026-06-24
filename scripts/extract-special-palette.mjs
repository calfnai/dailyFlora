import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const refs = [
  'public/special/her-bouquet/ref-01.heic',
  'public/special/her-bouquet/ref-02.heic',
  'public/special/her-bouquet/ref-03.heic'
];

const tempDir = mkdtempSync(join(tmpdir(), 'dailyflora-palette-'));

try {
  const converted = refs.map((file, index) => {
    const out = join(tempDir, `ref-${index + 1}.png`);
    execFileSync('sips', ['-s', 'format', 'png', file, '--out', out], { stdio: 'ignore' });
    return out;
  });

  const py = `
from PIL import Image
from collections import Counter
import colorsys, sys

paths = ${JSON.stringify(converted)}
counts = Counter()
for path in paths:
    image = Image.open(path).convert("RGB")
    image.thumbnail((180, 180))
    for r, g, b in image.getdata():
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if v < 0.18 or s < 0.10:
            continue
        key = (round(r / 24) * 24, round(g / 24) * 24, round(b / 24) * 24)
        counts[key] += 1

palette = []
for (r, g, b), _ in counts.most_common(40):
    if all(abs(r - pr) + abs(g - pg) + abs(b - pb) > 56 for pr, pg, pb in palette):
        palette.append((min(255, r), min(255, g), min(255, b)))
    if len(palette) == 12:
        break

print([("#%02x%02x%02x" % color) for color in palette])
`;

  const output = execFileSync('python3', ['-c', py], { encoding: 'utf8' });
  console.log(output.trim());
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
