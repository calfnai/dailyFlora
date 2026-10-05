import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const source = resolve('dailyflora-cloud');
const target = resolve('.codex/runtime/dailyflora-remote-cloud');
mkdirSync(target, { recursive: true });
for (const file of ['manifest.json', 'pages.json', 'App.vue', 'main.js', 'pages']) cpSync(resolve(source, file), resolve(target, file), { recursive: true });
const cloud = resolve(target, 'uniCloud-alipay');
mkdirSync(resolve(cloud, 'database'), { recursive: true });
for (const file of readdirSync(resolve(source, 'uniCloud-aliyun/database'))) {
  if (file.startsWith('dailyflora-beta-') && file.endsWith('.json')) cpSync(resolve(source, 'uniCloud-aliyun/database', file), resolve(cloud, 'database', file));
}
cpSync(resolve(source, 'uniCloud-aliyun/cloudfunctions/dailyflora-api-beta'), resolve(cloud, 'cloudfunctions/dailyflora-api-beta'), { recursive: true });
const packagePath = resolve(cloud, 'cloudfunctions/dailyflora-api-beta/package.json');
const meta = JSON.parse(readFileSync(packagePath, 'utf8'));
meta.version = '0.74.0';
meta['cloudfunction-config'].runtime = 'Nodejs18';
writeFileSync(packagePath, JSON.stringify(meta, null, 2) + '\n');
console.log('Prepared cloud deployment:', target);
console.log('Target must be alipay / env-00jy6xjkcayy (daily-fora).');
