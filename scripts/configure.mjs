import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const json = value => JSON.stringify(value);

/** Generate reviewable configuration only; never install, launch, or edit a user's existing settings. */
export function configure({ out, mode = 'memory', controlRoot, withMemory = false }) {
  if (!['memory', 'control'].includes(mode)) throw new Error('--mode must be memory or control');
  const control = mode === 'control';
  const memory = mode === 'memory' || withMemory;
  if (!out || !path.isAbsolute(out)) throw new Error('--out must be an absolute, unused directory outside the repository');
  out = path.resolve(out);
  const relative = path.relative(repoRoot, out);
  if (relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('--out must be outside the repository');
  if (fs.existsSync(out)) throw new Error('Output directory already exists; choose a new directory.');
  if (!control && controlRoot) throw new Error('--control-root is only used with --mode control');
  if (control && (!controlRoot || !path.isAbsolute(controlRoot) || !fs.existsSync(path.join(controlRoot, 'lib', 'index.js')))) throw new Error('--control-root must point to a built dsh-mcp-control checkout');
  const vault = path.join(out, 'data', 'vault');
  const profile = path.join(vault, 'dafeiyu', 'thoughts', '自我档案.md');
  let overlay = '# Generated paths are literal; no variable interpolation is required.\n';
  if (control) overlay += `- insert:\n    - id: starter-mcp-control\n      name: ${json(pathToFileURL(path.join(controlRoot, 'lib', 'index.js')).href)}\n      config:\n        tokenRef: DSH_MCP_CONTROL_TOKEN\n`;
  if (memory) overlay += `- id: basic-memory-bridge\n  config:\n    project: personal\n    vaultPath: ${json(vault)}\n- id: dsh-global-settings\n  config:\n    selfProfilePath: ${json(profile)}\n    memoryStatusDirectory: ${json(path.join(out, 'data', 'management', 'memory-status'))}\n`;
  // The installed plugin owns per-session state; generation must not switch it on.
  if (memory) overlay += '- id: dsh-pure-mode\n  config: {}\n';
  const files = {
    'dsh.patch.yml': overlay,
    'paths.json': JSON.stringify({ mode, requiredPlugins: memory ? ['dsh-session-settings', 'dsh-basic-memory-bridge', 'dsh-global-settings', 'dsh-pure-mode'] : [], harnessHome: path.join(out, 'harness-home'), vault, management: path.join(out, 'data', 'management'), selfProfile: profile, persona: path.join(out, 'harness-home', 'persona.md') }, null, 2) + '\n',
  };
  if (control) files['codex.mcp.toml'] = '[mcp_servers.dsh_harness]\nurl = "http://127.0.0.1:8931/mcp"\nbearer_token_env_var = "DSH_MCP_CONTROL_TOKEN"\n';
  if (memory) files['basic-memory.mcp.json'] = JSON.stringify({ mcpServers: { basic_memory: {
    transport: 'stdio', command: 'basic-memory', args: ['mcp', '--project', 'personal'], env: { BASIC_MEMORY_CONFIG_DIR: path.join(out, 'basic-memory-state') }
  } } }, null, 2) + '\n';
  fs.mkdirSync(out, { recursive: true });
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(out, name), text, { flag: 'wx' });
  return { mode, generated: Object.keys(files), output: out, deployed: false };
}

export function main(argv) {
  if (argv.includes('--help')) { console.log('node scripts/configure.mjs --out <new-absolute-directory> [--mode memory|control]\nDefault: memory (DSH memory/persona and per-session pure-mode plugin; does not enable a session switch).\nControl: requires --control-root <built-checkout>; optionally add --with-memory.'); return; }
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--with-memory') options.withMemory = true;
    else if (['--out', '--control-root', '--mode'].includes(argv[i]) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      const key = { '--out': 'out', '--control-root': 'controlRoot', '--mode': 'mode' }[argv[i]];
      options[key] = argv[++i];
    }
    else throw new Error('Unknown option or missing value');
  }
  console.log(JSON.stringify(configure(options)));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; }
}
