import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const entries = [
  ['docs/aesthetic-rating-board.md', 'docs/aesthetic-rating-board.md'],
  ['docs/codex-aesthetic-handoff.md', 'docs/codex-aesthetic-handoff.md'],
  ['docs/dailyflora-reference-gallery.html', 'docs/dailyflora-reference-gallery.html'],
  ['docs/dailyflora-reference-cards.html', 'docs/dailyflora-reference-cards.html'],
  ['docs/dailyflora-aesthetic-system-0.13.md', 'docs/dailyflora-aesthetic-system-0.13.md'],
  ['docs/dailyflora-codex-skill.md', 'docs/dailyflora-codex-skill.md'],
  ['docs/reference-flower-identification.md', 'docs/reference-flower-identification.md'],
  ['docs/释义', 'docs/释义'],
  ['docs/untitled folder', 'docs/untitled folder'],
  ['data/aesthetic-review-dashboard.json', 'data/aesthetic-review-dashboard.json']
];

for (const [source, destination] of entries) {
  const sourcePath = path.join(repoRoot, source);
  const destinationPath = path.join(repoRoot, 'dist', destination);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Sites build asset is missing: ${source}`);
  }

  fs.rmSync(destinationPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true, verbatimSymlinks: true });
}

const distPath = path.join(repoRoot, 'dist');
const clientPath = path.join(distPath, 'client');
const hostingSourcePath = path.join(repoRoot, '.openai', 'hosting.json');
const hostingOutputPath = path.join(distPath, '.openai', 'hosting.json');

if (!fs.existsSync(hostingSourcePath)) {
  throw new Error('Sites hosting configuration is missing.');
}

fs.mkdirSync(path.dirname(hostingOutputPath), { recursive: true });
fs.copyFileSync(hostingSourcePath, hostingOutputPath);
fs.rmSync(clientPath, { recursive: true, force: true });
fs.mkdirSync(clientPath, { recursive: true });

for (const entry of fs.readdirSync(distPath, { withFileTypes: true })) {
  if (entry.name === 'client' || entry.name === 'server' || entry.name === '.openai') continue;
  fs.renameSync(path.join(distPath, entry.name), path.join(clientPath, entry.name));
}
