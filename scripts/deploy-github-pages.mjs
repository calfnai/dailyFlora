import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ghVersion = '2.94.0';
const repoRoot = process.cwd();
const toolsRoot = path.join(repoRoot, '.tools', 'gh');
const sourceManifestPath = path.join(repoRoot, 'scripts', 'deploy-source-files.json');

const args = new Set(process.argv.slice(2));
const argValues = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--') && arg.includes('='))
    .map((arg) => {
      const [key, ...value] = arg.split('=');
      return [key, value.join('=')];
    })
);

const shouldLogin = args.has('--login');
const dryRun = args.has('--dry-run');
const skipBuild = args.has('--skip-build') || shouldLogin;
const mainMode = argValues.get('--main') || 'manifest';
const repoOverride = argValues.get('--repo');

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  throw new Error(message);
}

function run(command, commandArgs, options = {}) {
  return execFileSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 120 * 1024 * 1024,
    ...options
  });
}

function runStatus(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function findOnPath(name) {
  const result = runStatus('sh', ['-lc', `command -v ${name}`]);
  return result.status === 0 ? result.stdout.trim() : null;
}

function ghAssetInfo() {
  const platform = os.platform();
  const arch = os.arch();
  const ghArch = arch === 'arm64' ? 'arm64' : arch === 'x64' ? 'amd64' : '';

  if (!ghArch) fail(`Unsupported architecture for bundled gh download: ${arch}`);

  if (platform === 'darwin') {
    const folder = `gh_${ghVersion}_macOS_${ghArch}`;
    return {
      archive: `${folder}.zip`,
      folder,
      extractCommand: 'unzip',
      extractArgs: (archivePath, destination) => ['-q', '-o', archivePath, '-d', destination]
    };
  }

  if (platform === 'linux') {
    const folder = `gh_${ghVersion}_linux_${ghArch}`;
    return {
      archive: `${folder}.tar.gz`,
      folder,
      extractCommand: 'tar',
      extractArgs: (archivePath, destination) => ['-xzf', archivePath, '-C', destination]
    };
  }

  fail(`Unsupported platform for bundled gh download: ${platform}`);
}

function localGhPath() {
  const { folder } = ghAssetInfo();
  const binary = path.join(toolsRoot, folder, 'bin', os.platform() === 'win32' ? 'gh.exe' : 'gh');
  return fs.existsSync(binary) ? binary : null;
}

function downloadGh() {
  const existing = localGhPath();
  if (existing) return existing;

  const info = ghAssetInfo();
  const archiveUrl = `https://github.com/cli/cli/releases/download/v${ghVersion}/${info.archive}`;
  const downloadDir = path.join(toolsRoot, 'downloads');
  const archivePath = path.join(downloadDir, info.archive);

  fs.mkdirSync(downloadDir, { recursive: true });
  fs.mkdirSync(toolsRoot, { recursive: true });
  if (fs.existsSync(archivePath)) fs.rmSync(archivePath);

  log(`Downloading GitHub CLI ${ghVersion} to .tools/gh ...`);
  run(
    'curl',
    [
      '-L',
      '--fail',
      '--connect-timeout',
      '20',
      '--max-time',
      '120',
      '--retry',
      '2',
      '--retry-delay',
      '2',
      '-o',
      archivePath,
      archiveUrl
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );

  run(info.extractCommand, info.extractArgs(archivePath, toolsRoot));

  const binary = localGhPath();
  if (!binary) fail('GitHub CLI download finished, but gh binary was not found.');
  fs.chmodSync(binary, 0o755);
  return binary;
}

function resolveGh() {
  if (process.env.GH_CLI_PATH && fs.existsSync(process.env.GH_CLI_PATH)) {
    return process.env.GH_CLI_PATH;
  }

  const pathGh = findOnPath('gh');
  if (pathGh) return pathGh;

  return downloadGh();
}

function ensureGhAuth(gh) {
  const status = runStatus(gh, ['auth', 'status', '--hostname', 'github.com']);
  if (status.status === 0) return;

  if (!shouldLogin) {
    fail(
      [
        'GitHub CLI is installed, but it is not authenticated.',
        'Run: npm run github:login',
        'Then rerun: npm run deploy:github'
      ].join('\n')
    );
  }

  const login = spawnSync(gh, ['auth', 'login', '--hostname', 'github.com', '--web', '--git-protocol', 'https'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  if (login.status !== 0) fail('GitHub login did not complete successfully.');
}

function normalizeRepo(remote) {
  const trimmed = remote.trim();
  const httpsMatch = trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;

  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;

  fail(`Could not derive owner/repo from origin remote: ${trimmed}`);
}

function resolveRepo() {
  if (repoOverride) return repoOverride;
  return normalizeRepo(run('git', ['remote', 'get-url', 'origin']));
}

function ghApi(gh, apiArgs, input) {
  return execFileSync(gh, ['api', ...apiArgs], {
    cwd: repoRoot,
    input: input ? JSON.stringify(input) : undefined,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 120 * 1024 * 1024
  });
}

function ghApiJson(gh, apiArgs, input) {
  const endpoint = apiArgs.find((arg) => arg.startsWith('repos/')) || '';
  const retryableBlobUpload = endpoint.endsWith('/git/blobs');
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const out = ghApi(gh, apiArgs, input).trim();
      return out ? JSON.parse(out) : null;
    } catch (error) {
      const detail = `${error?.stderr || ''}\n${error?.message || ''}`;
      const transient = /HTTP (429|502|503|504)\b/.test(detail);
      if (!retryableBlobUpload || !transient || attempt === 4) throw error;
      log(`GitHub blob upload retry ${attempt}/3 after a transient API error.`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 1500);
    }
  }
  return null;
}

function tryGhApiJson(gh, apiArgs, input) {
  try {
    return { ok: true, value: ghApiJson(gh, apiArgs, input) };
  } catch (error) {
    return { ok: false, error };
  }
}

function filesUnder(root) {
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full);
    }
  }

  walk(root);
  return files.sort();
}

function copyReferenceGalleryToDist(pagesRoot) {
  const distDocs = path.join(pagesRoot, 'docs');
  const entries = [
    ['docs/aesthetic-rating-board.md', 'aesthetic-rating-board.md'],
    ['docs/codex-aesthetic-handoff.md', 'codex-aesthetic-handoff.md'],
    ['docs/dailyflora-reference-gallery.html', 'dailyflora-reference-gallery.html'],
    ['docs/dailyflora-reference-cards.html', 'dailyflora-reference-cards.html'],
    ['docs/dailyflora-aesthetic-system-0.13.md', 'dailyflora-aesthetic-system-0.13.md'],
    ['docs/dailyflora-codex-skill.md', 'dailyflora-codex-skill.md'],
    ['docs/dailyflora-flower-plan-samples.html', 'dailyflora-flower-plan-samples.html'],
    ['docs/reference-flower-identification.md', 'reference-flower-identification.md'],
    ['docs/释义', '释义'],
    ['docs/untitled folder', 'untitled folder']
  ];

  fs.mkdirSync(distDocs, { recursive: true });
  for (const [source, destination] of entries) {
    const sourcePath = path.join(repoRoot, source);
    const destinationPath = path.join(distDocs, destination);
    if (!fs.existsSync(sourcePath)) fail(`Reference gallery asset is missing: ${source}`);
    fs.rmSync(destinationPath, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    if (fs.statSync(sourcePath).isDirectory()) {
      const copy = runStatus('ditto', [sourcePath, destinationPath]);
      if (copy.status !== 0) {
        fs.cpSync(sourcePath, destinationPath, { recursive: true, verbatimSymlinks: true });
      }
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }

  const distData = path.join(pagesRoot, 'data');
  fs.mkdirSync(distData, { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, 'data', 'aesthetic-review-dashboard.json'),
    path.join(distData, 'aesthetic-review-dashboard.json')
  );
}

function readManifestFiles() {
  const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
  if (!Array.isArray(manifest)) fail('scripts/deploy-source-files.json must be a JSON array.');

  const missing = [];
  const files = [];
  for (const relativePath of manifest) {
    if (typeof relativePath !== 'string') fail('Deploy manifest entries must be strings.');
    if (relativePath.includes('..')) fail(`Refusing manifest path with "..": ${relativePath}`);

    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) missing.push(relativePath);
    else if (fs.statSync(absolutePath).isFile()) files.push(relativePath);
  }

  if (missing.length) {
    fail(`Deploy manifest contains missing files:\n${missing.map((file) => `- ${file}`).join('\n')}`);
  }

  return files;
}

function trackedFiles() {
  return run('git', ['ls-files', '-z'])
    .split('\0')
    .filter(Boolean)
    .filter((file) => !file.startsWith('.github/workflows/'))
    .filter((file) => !file.startsWith('dist/'))
    .filter((file) => !file.startsWith('node_modules/'))
    .filter((file) => !file.startsWith('data/inbox/'));
}

function resolveMainFiles() {
  if (mainMode === 'skip') return [];
  if (mainMode === 'manifest') return readManifestFiles();
  if (mainMode === 'tracked') return trackedFiles();
  fail(`Unknown --main mode: ${mainMode}. Use manifest, tracked, or skip.`);
}

function treeEntries(gh, repo, files, stripPrefix = '') {
  const snapshots = files.map((file) => {
    const repoPath = stripPrefix ? file.slice(stripPrefix.length).replace(/^\//, '') : file;
    const content = dryRun ? '' : fs.readFileSync(path.join(repoRoot, file)).toString('base64');
    return { repoPath, content };
  });

  return snapshots.map(({ repoPath, content }) => {
    if (dryRun) {
      return {
        path: repoPath,
        mode: '100644',
        type: 'blob',
        content: ''
      };
    }
    const blob = ghApiJson(gh, ['-X', 'POST', `repos/${repo}/git/blobs`, '--input', '-'], {
      content,
      encoding: 'base64'
    });
    return {
      path: repoPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    };
  });
}

function updateBranchWithTree(gh, repo, branch, entries, message, useBaseTree) {
  const refPath = `repos/${repo}/git/ref/heads/${branch}`;
  const refResult = tryGhApiJson(gh, [refPath]);
  let parentSha = null;
  let baseTree;

  if (refResult.ok) {
    parentSha = refResult.value.object.sha;
    const parentCommit = ghApiJson(gh, [`repos/${repo}/git/commits/${parentSha}`]);
    baseTree = parentCommit.tree.sha;
  }

  const treePayload = useBaseTree && baseTree ? { base_tree: baseTree, tree: entries } : { tree: entries };
  const tree = ghApiJson(gh, ['-X', 'POST', `repos/${repo}/git/trees`, '--input', '-'], treePayload);
  const commit = ghApiJson(gh, ['-X', 'POST', `repos/${repo}/git/commits`, '--input', '-'], {
    message,
    tree: tree.sha,
    parents: parentSha ? [parentSha] : []
  });

  if (refResult.ok) {
    ghApiJson(gh, ['-X', 'PATCH', `repos/${repo}/git/refs/heads/${branch}`, '--input', '-'], {
      sha: commit.sha,
      force: false
    });
  } else {
    ghApiJson(gh, ['-X', 'POST', `repos/${repo}/git/refs`, '--input', '-'], {
      ref: `refs/heads/${branch}`,
      sha: commit.sha
    });
  }

  return { branch, commit: commit.sha, files: entries.length };
}

function ensurePagesSource(gh, repo) {
  const current = tryGhApiJson(gh, [`repos/${repo}/pages`]);
  const payload = { source: { branch: 'gh-pages', path: '/' } };

  if (dryRun) return;

  if (current.ok) {
    ghApiJson(gh, ['-X', 'PUT', `repos/${repo}/pages`, '--input', '-'], payload);
  } else {
    ghApiJson(gh, ['-X', 'POST', `repos/${repo}/pages`, '--input', '-'], payload);
  }
}

function pollPages(gh, repo) {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const pages = tryGhApiJson(gh, [`repos/${repo}/pages`]);
    if (pages.ok) {
      log(`Pages status: ${pages.value.status} ${pages.value.html_url}`);
      if (pages.value.status === 'built') return pages.value.html_url;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 8000);
  }
  return null;
}

function main() {
  const gh = resolveGh();
  ensureGhAuth(gh);

  if (shouldLogin) {
    log('GitHub login is ready.');
    return;
  }

  const repo = resolveRepo();
  const mainFiles = resolveMainFiles();

  if (!skipBuild) {
    log('Building site...');
    run('npm', ['run', 'build'], { stdio: ['ignore', 'inherit', 'inherit'] });
  }

  const distRoot = path.join(repoRoot, 'dist');
  const sitesClientRoot = path.join(distRoot, 'client');
  const pagesRoot = fs.existsSync(path.join(sitesClientRoot, 'index.html')) ? sitesClientRoot : distRoot;
  const distIndex = path.join(pagesRoot, 'index.html');
  if (!fs.existsSync(distIndex)) fail('Built index.html does not exist. Run npm run build first.');

  copyReferenceGalleryToDist(pagesRoot);

  const pagesPrefix = path.relative(repoRoot, pagesRoot);
  const pagesEntries = treeEntries(
    gh,
    repo,
    filesUnder(pagesRoot).map((file) => path.relative(repoRoot, file)),
    pagesPrefix
  );
  pagesEntries.push({ path: '.nojekyll', mode: '100644', type: 'blob', content: '' });

  log(`Repository: ${repo}`);
  log(`Main mode: ${mainMode}${mainFiles.length ? ` (${mainFiles.length} files)` : ''}`);
  log(`Pages files: ${pagesEntries.length}`);

  if (dryRun) {
    log('Dry run only. No GitHub branches were updated.');
    return;
  }

  let mainResult = null;
  if (mainMode !== 'skip') {
    mainResult = updateBranchWithTree(gh, repo, 'main', treeEntries(gh, repo, mainFiles), 'Deploy DailyFlora source', true);
  }
  const pagesResult = updateBranchWithTree(gh, repo, 'gh-pages', pagesEntries, 'Deploy DailyFlora site', false);
  ensurePagesSource(gh, repo);
  const pagesUrl = pollPages(gh, repo);

  log(
    JSON.stringify(
      {
        main: mainResult,
        pages: pagesResult,
        pagesUrl
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
