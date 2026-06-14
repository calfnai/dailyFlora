# Lobster Inbox

Put Xiaohongshu fetch results here, usually under a dated folder:

```text
data/inbox/2026-06-14/
  lobster-task.json
  notes.json
  screenshots/
```

Run:

```bash
npm run lobster:plan
npm run inspiration:ingest -- data/inbox/2026-06-14/notes.json
```

`npm run lobster:plan` creates a handoff packet for Lobster, the external AI app
you use with DeepSeek. Open the generated `lobster-prompt.md` and
`lobster-task.json` in Lobster, let it check Xiaohongshu, then place its result
at `notes.json`.

`notes.json` may be either an array or an object with a `notes` array. Each note
should follow this compact shape:

```json
{
  "creatorId": "5cf91ecd0000000016029124",
  "creatorName": "柏恩花室",
  "sourceUrl": "https://www.xiaohongshu.com/explore/...",
  "title": "热带丛林",
  "observedAt": "2026-06-14",
  "imagePaths": ["data/inbox/2026-06-14/screenshots/note-1.png"],
  "caption": "optional copied caption or Lobster summary",
  "colorNotes": ["lemon yellow over dark stage"],
  "spatialNotes": ["round but airy crown, branches visible on side view"],
  "materialNotes": ["small flowers, grasses, berries, star-like filler"],
  "parameterSuggestions": ["increase outerLineCount on this theme"]
}
```
