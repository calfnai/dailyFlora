import { createClient } from '@supabase/supabase-js';
import { get } from '@vercel/blob';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const outputArgument = process.argv[2];
if (!outputArgument) {
  console.error('Usage: npm run backup:user-references -- /absolute/path/to/backup-directory');
  process.exit(1);
}

const outputDirectory = resolve(outputArgument);
if (outputDirectory === sep) {
  console.error('Refusing to use the filesystem root as a backup directory.');
  process.exit(1);
}

try {
  await stat(outputDirectory);
  console.error('Backup directory already exists; choose a new empty path.');
  process.exit(1);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey || !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and BLOB_READ_WRITE_TOKEN are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const { data, error } = await supabase
  .from('user_reference_generations')
  .select('*')
  .order('created_at', { ascending: true });
if (error) throw error;

await mkdir(outputDirectory, { recursive: true });
for (const record of data) {
  const recordDirectory = resolve(outputDirectory, 'users', record.user_id, 'references', record.record_id);
  await mkdir(recordDirectory, { recursive: true });
  for (const [filename, pathname] of [
    ['reference.webp', record.reference_pathname],
    ['thumbnail.webp', record.thumbnail_pathname]
  ]) {
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) throw new Error(`Missing Blob: ${pathname}`);
    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    await writeFile(resolve(recordDirectory, filename), bytes);
  }
}

const manifest = {
  format: 'dailyflora-user-reference-backup-v1',
  createdAt: new Date().toISOString(),
  recordCount: data.length,
  records: data
};
await writeFile(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
console.log(`Backed up ${data.length} records to ${outputDirectory}`);
