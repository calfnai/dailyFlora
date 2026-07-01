import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const inputArg = process.argv[2];

if (!inputArg) {
  console.error('Usage: node scripts/ingest-owner-links.mjs data/inbox/YYYY-MM-DD/owner-links.json');
  process.exit(1);
}

const inputPath = resolve(root, inputArg);
const ownerLinks = JSON.parse(await readFile(inputPath, 'utf8'));
const observedAt = ownerLinks.date || new Date().toISOString().slice(0, 10);
const outputPath = resolve(root, 'data', 'inbox', observedAt, 'notes.json');

const headers = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
};

function getNoteId(url) {
  return url.match(/\/(?:discovery\/)?(?:item|explore)\/([^?/#]+)/)?.[1] || null;
}

async function resolveOwnerUrl(url) {
  if (getNoteId(url)) return url;
  const response = await fetch(url, { redirect: 'follow', headers });
  return response.url || url;
}

function extractInitialState(html) {
  const match = html.match(/window\.__INITIAL_STATE__=(.*)<\/script>/s);
  if (!match) return null;
  return JSON.parse(match[1].replace(/\bundefined\b/g, 'null'));
}

function noteFromState(state, noteId) {
  const detailMap = state?.note?.noteDetailMap || {};
  return detailMap[noteId]?.note || Object.values(detailMap)[0]?.note || null;
}

function inferNotes({ title, desc, tags }) {
  const tagNames = tags.map((tag) => tag.name).filter(Boolean);
  const text = `${title}\n${desc}\n${tagNames.join(' ')}`;
  const colorNotes = [];
  const spatialNotes = [];
  const materialNotes = [];
  const parameterSuggestions = [];

  if (/温暖|明亮|阳光|暖|橙|黄/.test(text)) {
    colorNotes.push('warm bright palette signal; bias toward sunlit yellow, peach, and fresh green accents');
    parameterSuggestions.push('add a warm daylight palette variant with higher yellow/peach weight and softer green support');
  }
  if (/彩虹|五彩|缤纷|多色|彩色/.test(text)) {
    colorNotes.push('rainbow palette signal; use multiple clear hues but keep green, pale flowers, and air gaps as buffers');
    spatialNotes.push('multi-color bouquet cue; distribute color by material role instead of making one noisy color cloud');
    materialNotes.push('use small blooms, fruit points, and line flowers to carry saturated colors at different scales');
    parameterSuggestions.push('increase controlled multi-hue variation while preserving readable flower roles and outer air');
  }
  if (/荔枝|Lychee|lychee/.test(text)) {
    colorNotes.push('lychee garden cue; keep pink-red sweetness balanced with fresh green and pale highlights');
    materialNotes.push('fruit-garden cue; consider small rounded fruit or pearl accents only when attached to stems');
    parameterSuggestions.push('treat fruit dots as branch-owned accents, not loose random particles');
  }
  if (/自然|田园|河床|蝉鸣|草|枝|叶|花束/.test(text)) {
    spatialNotes.push('natural bouquet cue; keep the silhouette airy instead of a compact dome');
    materialNotes.push('increase branch, leaf, grass, and small filler rhythm around the outer shell');
    parameterSuggestions.push('raise outer branch/grass count and vary stem heights for a field-like structure');
  }
  if (/定制|还原|搭配|花型|低预算高颜值/.test(text)) {
    colorNotes.push('composition reads as carefully matched rather than high-contrast novelty');
    spatialNotes.push('favor a balanced bouquet body with recognizable focal blooms and supporting texture');
    parameterSuggestions.push('keep focal bloom count moderate, then use small particles to echo material matching');
  }
  if (!colorNotes.length) colorNotes.push('no explicit color detail available from public text; keep source link pending for visual review');
  if (!spatialNotes.length) spatialNotes.push('no explicit spatial detail available from public text; keep source link pending for visual review');
  if (!materialNotes.length) materialNotes.push('no explicit material detail available from public text; keep source link pending for visual review');
  if (!parameterSuggestions.length) parameterSuggestions.push('retain as pending inspiration until visual data can be read reliably');

  return { colorNotes, spatialNotes, materialNotes, parameterSuggestions };
}

const notes = [];
const accessIssues = [];

for (const link of ownerLinks.links || []) {
  let resolvedSourceUrl = link.sourceUrl;
  try {
    resolvedSourceUrl = await resolveOwnerUrl(link.sourceUrl);
  } catch {
    resolvedSourceUrl = link.sourceUrl;
  }

  const noteId = getNoteId(resolvedSourceUrl);
  if (!noteId) {
    accessIssues.push({
      sourceUrl: link.sourceUrl,
      reason: 'invalid-url',
      detail: 'Could not extract Xiaohongshu note id from owner-provided link.'
    });
    continue;
  }

  try {
    const response = await fetch(resolvedSourceUrl, { redirect: 'follow', headers });
    const html = await response.text();
    const state = extractInitialState(html);
    const note = state ? noteFromState(state, noteId) : null;

    if (!response.ok || !note) {
      const title = link.title || 'Untitled Xiaohongshu inspiration';
      if (link.title) {
        const inferred = inferNotes({ title, desc: '', tags: [] });
        notes.push({
          creatorId: 'unknown',
          creatorName: link.creatorName || 'Unknown creator',
          sourceUrl: resolvedSourceUrl,
          originalSourceUrl: link.sourceUrl,
          title,
          observedAt,
          imagePaths: [],
          caption: 'Owner-provided title only; public page data was not readable.',
          evidence: {
            noteId,
            imageCount: 0,
            tags: [],
            originalSourceUrl: link.sourceUrl
          },
          ...inferred
        });
      }
      accessIssues.push({
        sourceUrl: link.sourceUrl,
        creatorName: link.creatorName || 'Unknown creator',
        reason: response.ok ? 'unreadable-public-data' : `http-${response.status}`,
        detail: `Fetched ${html.length} bytes from ${response.url}, but could not extract note data from __INITIAL_STATE__.`
      });
      continue;
    }

    const title = note.title || link.title || 'Untitled Xiaohongshu inspiration';
    const desc = note.desc || '';
    const tags = note.tagList || [];
    const inferred = inferNotes({ title, desc, tags });

    notes.push({
      creatorId: note.user?.userId || 'unknown',
      creatorName: note.user?.nickname || link.creatorName || 'Unknown creator',
      sourceUrl: resolvedSourceUrl,
      originalSourceUrl: link.sourceUrl,
      title,
      observedAt,
      imagePaths: [],
      caption: desc,
      evidence: {
        noteId,
        imageCount: note.imageList?.length || 0,
        tags: tags.map((tag) => tag.name).filter(Boolean),
        originalSourceUrl: link.sourceUrl
      },
      ...inferred
    });
  } catch (error) {
    accessIssues.push({
      sourceUrl: link.sourceUrl,
      creatorName: link.creatorName || 'Unknown creator',
      reason: 'fetch-error',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      observedAt,
      source: 'owner-provided-links',
      ownerLinksFile: inputArg,
      notes,
      accessIssues
    },
    null,
    2
  )}\n`
);

console.log(`Wrote ${notes.length} note${notes.length === 1 ? '' : 's'} to ${outputPath}`);
if (accessIssues.length) {
  console.log(`Recorded ${accessIssues.length} access issue${accessIssues.length === 1 ? '' : 's'}.`);
}
