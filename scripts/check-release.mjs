import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-files.json'), 'utf8'));
const allowed = new Set(manifest);
const errors = [];
const seen = new Set();
const rules = [
  ['absolute drive path', /\b[A-Za-z]:[\\/]/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['API credential', /\bsk-[A-Za-z0-9_-]{16,}/],
  ['GitHub credential', /\bgh[pousr]_[A-Za-z0-9]{20,}/],
  ['embedded HTTP credential', /https?:\/\/[^\s/@]+:[^\s/@]+@/],
  ['literal bearer credential', /Bearer [A-Za-z0-9._~+\/-]{24,}/],
  ['real session identity', /session-(?!00000000-0000-0000-0000-000000000000|11111111-1111-1111-1111-111111111111)[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i],
];
function walk(dir, prefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + entry.name;
    if (entry.isDirectory() && ['.git', 'node_modules'].includes(entry.name)) continue;
    if (entry.isSymbolicLink()) { errors.push(rel + ': symlink is not publishable'); continue; }
    if (entry.isDirectory()) { walk(path.join(dir, entry.name), rel + '/'); continue; }
    seen.add(rel);
    if (!allowed.has(rel)) errors.push(rel + ': absent from release allowlist');
    const buffer = fs.readFileSync(path.join(dir, entry.name));
    if (buffer.includes(0)) { errors.push(rel + ': binary content'); continue; }
    const text = buffer.toString('utf8');
    for (const [label, pattern] of rules) if (pattern.test(text)) errors.push(rel + ': ' + label);
    for (const term of (process.env.RELEASE_FORBIDDEN_TERMS || '').split(',').filter(Boolean)) if (text.includes(term)) errors.push(rel + ': locally configured forbidden term');
    if (/\.(?:db|sqlite\d*|zip|tgz|png|jpe?g|log)$/i.test(rel) || /(^|\/)(?:\.env(?:\.|$)|\.harness|backups|experiments|vault|management|sessions|runtime)(?:\/|$)/.test(rel)) errors.push(rel + ': runtime/private artifact');
  }
}
walk(root);
for (const rel of allowed) if (!seen.has(rel)) errors.push(rel + ': allowlisted file missing');
if (allowed.size !== manifest.length) errors.push('duplicate manifest entry');
console.log(JSON.stringify({ ok: errors.length === 0, files: seen.size, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
