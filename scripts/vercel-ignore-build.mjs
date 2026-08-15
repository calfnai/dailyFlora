const branch = process.env.VERCEL_GIT_COMMIT_REF || '';

if (branch === 'gh-pages') {
  console.log('Skipping Vercel build for gh-pages: GitHub Pages serves this static artifact branch.');
  process.exit(0);
}

console.log(`Running Vercel build for ${branch || 'unknown branch'}.`);
process.exit(1);
