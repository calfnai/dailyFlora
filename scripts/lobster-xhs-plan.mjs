import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
const outDir = resolve(root, 'data', 'inbox', today);
const creatorPath = resolve(root, 'data', 'xiaohongshu-creators.json');
const taskPath = resolve(outDir, 'lobster-task.json');
const promptPath = resolve(outDir, 'lobster-prompt.md');

const creators = JSON.parse(await readFile(creatorPath, 'utf8')).creators;

const task = {
  date: today,
  source: 'xiaohongshu',
  assistant: 'Lobster external AI app running DeepSeek or another model',
  goal: 'Organize owner-provided Xiaohongshu links for DailyFlora inspiration review without stressing the account session.',
  accessMode: 'owner-provided-links',
  creators,
  ownerProvidedLinks: [
    {
      sourceUrl: 'paste Xiaohongshu note/profile link here',
      creatorName: 'optional',
      title: 'optional'
    }
  ],
  outputFile: `data/inbox/${today}/notes.json`,
  outputShape: {
    notes: [
      {
        creatorId: 'string',
        creatorName: 'string',
        sourceUrl: 'string',
        title: 'string',
        observedAt: today,
        imagePaths: [],
        caption: 'optional summary from accessible page text',
        colorNotes: ['short visual observation'],
        spatialNotes: ['3D bouquet structure observation'],
        materialNotes: ['flower/leaf/filler observation'],
        parameterSuggestions: ['DailyFlora generator suggestion']
      }
    ],
    accessIssues: [
      {
        creatorId: 'string',
        reason: 'login-required | blocked | no-new-posts | other',
        detail: 'short detail'
      }
    ]
  },
  rules: [
    'Process only links explicitly provided by the owner in this run.',
    'Do not crawl creator homepages to discover more posts.',
    'Do not ask the owner to log in repeatedly.',
    'Open at most one Xiaohongshu URL at a time.',
    'If Xiaohongshu asks for login, captcha, SMS, QR scan, or account verification, stop browsing immediately.',
    'Do not copy original images into the web app.',
    'Do not ask the owner for screenshots unless the owner volunteers them.',
    'Use only visible/link-accessible information and keep observations compact.',
    'If access fails, write accessIssues instead of guessing.'
  ]
};

const prompt = `# Lobster Task: DailyFlora Xiaohongshu Inspiration

This is an owner-provided-links task. Do not batch-open Xiaohongshu pages.

Use only links explicitly provided by the owner for this run. The creators listed in \`lobster-task.json\` are reference names, not a browsing queue.

Safety rules:

- Do not crawl creator homepages to discover more posts.
- Do not open multiple Xiaohongshu tabs.
- Do not trigger repeated login prompts.
- Do not request SMS, QR scan, captcha, or account verification.
- If Xiaohongshu asks for login or verification, stop browsing and record an \`accessIssues\` item.
- Do not ask the owner for screenshots unless the owner volunteers them.
- If no owner-provided links are available, return only \`accessIssues\` and ask for links.

Return \`notes.json\` in the same folder. Keep it compact. Focus only on what can improve a 360-degree low-power particle bouquet:

- color rhythm
- spatial structure from all sides
- small flower / branch / leaf / star-point material rhythm
- parameter suggestions for DailyFlora

Do not prepare images for publication. Screenshots, if needed, stay in this inbox folder only.
If a page is blocked, logged out, or has no new posts, record that in \`accessIssues\`.
`;

await mkdir(outDir, { recursive: true });
await writeFile(taskPath, `${JSON.stringify(task, null, 2)}\n`);
await writeFile(promptPath, prompt);

const commandTemplate = process.env.LOBSTER_COMMAND;
if (commandTemplate) {
  const [bin, ...args] = commandTemplate
    .replaceAll('{task}', taskPath)
    .replaceAll('{prompt}', promptPath)
    .replaceAll('{out}', outDir)
    .split(' ')
    .filter(Boolean);
  await execFileAsync(bin, args, { cwd: root, stdio: 'inherit' });
} else {
  console.log(`Wrote Lobster task files:\n- ${taskPath}\n- ${promptPath}`);
  console.log('Open these files in Lobster and ask it to write notes.json in the same folder.');
  console.log('Optional only: if you ever have a Lobster CLI, set LOBSTER_COMMAND with {task}, {prompt}, or {out} placeholders.');
}
