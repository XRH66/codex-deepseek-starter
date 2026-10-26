import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files = JSON.parse(fs.readFileSync(path.join(root, 'release-files.json'), 'utf8')).filter(f => f.endsWith('.md'));
const errors = [];
let checked = 0;
for (const file of files) {
  const body = fs.readFileSync(path.join(root, file), 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    checked++;
    if (!fs.existsSync(path.resolve(root, path.dirname(file), decodeURIComponent(target)))) errors.push(file + ' -> ' + target);
  }
}
console.log(JSON.stringify({ ok: !errors.length, checked, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
