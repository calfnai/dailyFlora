import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../downloads/index.html', import.meta.url), 'utf8');

test('downloads page exposes both mirrors for each macOS architecture', () => {
  const expectedLinks = [
    'https://kmfon4jqb9.feishu.cn/file/EXiXbSSwQorxOJxULBxcwMeRnHf?from=from_copylink',
    'https://1drv.ms/u/c/0302618EAAA684CD/IQAr-QXcorcmSYDy9qobFXCMAT7WTyV_ZW5BedzXWubRNQ0?e=2HIlhy',
    'https://kmfon4jqb9.feishu.cn/file/Cbabbkju5oIfxTxuCtZcq0PxnOg?from=from_copylink',
    'https://1drv.ms/u/c/0302618EAAA684CD/IQDb6HMXaMPfT7aXn2JTAmVJAVB_KAMCiYOAVqPHK-k9NKw?e=1fCeSi'
  ];

  for (const link of expectedLinks) assert.ok(html.includes(`href="${link}"`), `missing download link: ${link}`);
  assert.match(html, /id="mac-download"/);
  assert.match(html, /data-i18n="platforms\.macArmLabel"/);
  assert.match(html, /data-i18n="platforms\.macIntelLabel"/);
});

test('downloads page preserves the finalized four-link Windows release', () => {
  const expectedLinks = [
    'https://1drv.ms/u/c/0302618EAAA684CD/IQA2VXVMo3wrSLEwtqweoNyTATjDAuGUEL6hye6pmcbOpOQ?e=BlNqCb',
    'https://1drv.ms/u/c/0302618EAAA684CD/IQBu39PnfRU2Q5iH-g9k049lAfhlfrzrI6rF0QCMM-oofD8?e=xilg0A',
    'https://kmfon4jqb9.feishu.cn/file/ImxZb1XYvoZQxzxhtD4c08Lbnrb?from=from_copylink',
    'https://kmfon4jqb9.feishu.cn/file/L7Orb73hfoO5p2xaYJicjGsFnxb?from=from_copylink'
  ];

  for (const link of expectedLinks) assert.ok(html.includes(`href="${link}"`), `missing Windows download link: ${link}`);
  assert.match(html, /id="windows-download-source-title"/);
  assert.match(html, /data-i18n="platforms\.windowsOneDriveTitle"/);
  assert.match(html, /data-i18n="platforms\.windowsFeishuTitle"/);
});
