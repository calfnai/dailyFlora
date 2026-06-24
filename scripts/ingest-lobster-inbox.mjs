import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: npm run inspiration:ingest -- data/inbox/YYYY-MM-DD/notes.json');
  process.exit(1);
}

const inputPath = resolve(root, inputArg);
const libraryPath = resolve(root, 'data', 'inspiration-library.json');
const input = JSON.parse(await readFile(inputPath, 'utf8'));
const library = JSON.parse(await readFile(libraryPath, 'utf8'));
const notes = Array.isArray(input) ? input : input.notes || [];
const accessIssues = input.accessIssues || [];

if (!Array.isArray(library.pendingRecommendations)) {
  library.pendingRecommendations = [];
}

const existingIds = new Set([
  ...library.entries.map((entry) => entry.id),
  ...library.pendingRecommendations.map((entry) => entry.id)
]);
const existingSourceUrls = new Set([
  ...library.entries.map((entry) => entry.sourceUrl).filter(Boolean),
  ...library.pendingRecommendations.map((entry) => entry.sourceUrl).filter(Boolean)
]);

let added = 0;
for (const note of notes) {
  const observedAt = note.observedAt || new Date().toISOString().slice(0, 10);
  const sourceUrl = note.sourceUrl || 'unknown-source';
  const sourceKey = note.evidence?.noteId || createHash('sha1').update(sourceUrl).digest('hex').slice(0, 16);
  const id = `inspiration-${observedAt}-${sourceKey}`;
  if (existingIds.has(id) || existingSourceUrls.has(sourceUrl)) continue;

  library.pendingRecommendations.push({
    id,
    creatorId: note.creatorId || 'unknown',
    creatorName: note.creatorName || 'Unknown creator',
    sourceUrl,
    title: note.title || 'Untitled inspiration',
    observedAt,
    colorNotes: note.colorNotes || [],
    spatialNotes: note.spatialNotes || [],
    materialNotes: note.materialNotes || [],
    parameterSuggestions: note.parameterSuggestions || [],
    status: 'pending-confirmation',
    inboxEvidence: {
      file: inputArg,
      imagePaths: note.imagePaths || [],
      caption: note.caption || ''
    }
  });
  existingIds.add(id);
  existingSourceUrls.add(sourceUrl);
  added += 1;
}

library.lastIngest = {
  at: new Date().toISOString(),
  input: inputArg,
  added,
  accessIssues
};

await writeFile(libraryPath, `${JSON.stringify(library, null, 2)}\n`);
console.log(`Added ${added} pending inspiration item${added === 1 ? '' : 's'}.`);
if (accessIssues.length) {
  console.log(`Recorded ${accessIssues.length} access issue${accessIssues.length === 1 ? '' : 's'} in lastIngest.`);
}
