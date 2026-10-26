#!/usr/bin/env node
/** Portable client for mochgolf/dsh-mcp-control, adapted from this project's local CLI.
 * Upstream server attribution and the client distinction are documented in NOTICE.md. */
import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { parse as parseToml } from 'smol-toml';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const DEFAULT_MCP_URL = 'http://127.0.0.1:3080/mcp';
const DEFAULT_PERMISSION = 'danger-full-access';
const DEFAULT_WAIT_MS = 20000;
const TOOL_TIMEOUT_MS = 45000;

const USAGE = `usage:
  dsh-cli.mjs start  --cwd <path> --task-file <file> [--permission <preset>]
  dsh-cli.mjs send   --session <id> --task-file <file> [--steer]
  dsh-cli.mjs status --session <id>
  dsh-cli.mjs result --session <id> --request <id> [--wait-ms 20000]

Task files are read as UTF-8. start uses permission preset "danger-full-access"
unless --permission names another native preset. Output is one compact JSON line.`;

/** A failure that maps to a stable error code and a non-zero exit. */
class CliError extends Error {
  constructor(code, message, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

function usage(message) {
  return new CliError('usage', message, 2);
}

/** Minimal `--flag value` / `--flag` parser; unknown flags are refused. */
function parseArgs(argv) {
  const [command, ...rest] = argv;
  const allowed = {
    start: new Set(['cwd', 'task-file', 'permission']),
    send: new Set(['session', 'task-file', 'steer']),
    status: new Set(['session']),
    result: new Set(['session', 'request', 'wait-ms']),
  };
  if (!Object.hasOwn(allowed, command)) {
    throw usage(command === undefined ? 'missing command' : `unknown command: ${command}`);
  }
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--') || token === '--') throw usage(`unexpected argument: ${token}`);
    const name = token.slice(2);
    if (!allowed[command].has(name)) throw usage(`unknown flag for ${command}: --${name}`);
    if (name === 'steer') {
      flags.steer = true;
      continue;
    }
    const value = rest[i + 1];
    if (value === undefined || value.startsWith('--')) throw usage(`missing value for --${name}`);
    flags[name] = value;
    i += 1;
  }
  return { command, flags };
}

function requireFlag(flags, name) {
  const value = flags[name];
  if (typeof value !== 'string' || value.length === 0) throw usage(`missing --${name}`);
  return value;
}

/** Environment credentials take precedence; never print or persist credentials. */
export function connectionConfig(env = process.env) {
  let server = {};
  const file = env.DSH_CODEX_CONFIG || path.join(env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml');
  try { server = parseToml(fs.readFileSync(file, 'utf8')).mcp_servers?.dsh_harness || {}; }
  catch (error) {
    if (error.code !== 'ENOENT' || !env.DSH_MCP_CONTROL_TOKEN) throw new CliError('config', 'Cannot parse Codex config; set DSH_CODEX_CONFIG or DSH_MCP_CONTROL_TOKEN.');
  }
  const url = env.DSH_MCP_URL || server.url || DEFAULT_MCP_URL;
  let parsed;
  try { parsed = new URL(url); } catch { throw new CliError('config', 'Invalid DSH_MCP_URL.'); }
  if (parsed.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(parsed.hostname) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new CliError('config', 'Use a literal loopback HTTP endpoint without embedded credentials or query parameters.');
  }
  const token = env.DSH_MCP_CONTROL_TOKEN || (server.bearer_token_env_var ? env[server.bearer_token_env_var] : '');
  const authorization = token ? 'Bearer ' + token : server.http_headers?.Authorization;
  if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9._~+\/=-]+$/.test(authorization)) {
    throw new CliError('config', 'Set the token environment variable referenced by bearer_token_env_var (or DSH_MCP_CONTROL_TOKEN).');
  }
  return { url: parsed.href, authorization };
}

/** Resolve cwd to a fully qualified existing directory (endpoint requires it). */
function resolveCwd(input) {
  const absolute = path.resolve(input);
  let stat;
  try {
    stat = fs.statSync(absolute);
  } catch {
    throw new CliError('cwd', `cwd does not exist: ${absolute}`);
  }
  if (!stat.isDirectory()) throw new CliError('cwd', `cwd is not a directory: ${absolute}`);
  return absolute;
}

/** Read a UTF-8 task file, drop a BOM, and refuse an empty prompt. */
function readTaskFile(input) {
  const absolute = path.resolve(input);
  let text;
  try {
    text = fs.readFileSync(absolute, 'utf8');
  } catch {
    throw new CliError('task-file', `cannot read task file: ${absolute}`);
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  if (text.trim().length === 0) throw new CliError('task-file', `task file is empty: ${absolute}`);
  return text;
}

/** Read a positive integer flag, or a zero that means "do not wait". */
function readWaitMs(value) {
  if (value === undefined) return DEFAULT_WAIT_MS;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > 20000) throw usage('--wait-ms must be an integer from 0 to 20000');
  return Number(value);
}

function excerpt(value, max = 400) {
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}

function errorMessage(error) {
  if (error instanceof Error) return excerpt(error.message);
  return excerpt(String(error));
}

/** Open one MCP connection to the running Web listener. */
async function openClient({ url, authorization }) {
  const client = new Client({ name: 'dsh-cli', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: authorization } },
  });
  try {
    await client.connect(transport);
  } catch (error) {
    try {
      await client.close();
    } catch {
      // The connect failure is the one worth reporting.
    }
    throw new CliError('connect', 'Cannot connect to the configured local MCP endpoint.');
  }
  return client;
}

function textPayload(result) {
  const part = Array.isArray(result.content)
    ? result.content.find((item) => item?.type === 'text' && typeof item.text === 'string')
    : undefined;
  if (part === undefined) return null;
  try {
    return JSON.parse(part.text);
  } catch {
    return null;
  }
}

/** Call one native tool and return its structured payload. */
async function callTool(client, name, args) {
  let result;
  try {
    result = await client.callTool({ name, arguments: args }, { timeout: TOOL_TIMEOUT_MS });
  } catch (error) {
    throw new CliError('transport', `${name} transport failed`);
  }
  const payload = result.structuredContent ?? textPayload(result);
  if (result.isError === true) {
    const failure = payload?.error;
    throw new CliError(
      typeof failure?.code === 'string' ? failure.code : 'tool-error',
      `${name} failed; inspect the local Harness UI for details`,
    );
  }
  if (payload === null || typeof payload !== 'object') {
    throw new CliError('protocol', `${name} returned no structured result`);
  }
  return payload;
}

async function runCommand(client, command, flags) {
  if (command === 'start') {
    const cwd = resolveCwd(requireFlag(flags, 'cwd'));
    const prompt = readTaskFile(requireFlag(flags, 'task-file'));
    const requestId = randomUUID();
    const receipt = await callTool(client, 'session_start', {
      cwd,
      prompt,
      permission_preset: flags.permission ?? DEFAULT_PERMISSION,
      request_id: requestId,
    });
    return { session_id: receipt.session_id, request_id: receipt.request_id ?? requestId };
  }

  if (command === 'send') {
    const sessionId = requireFlag(flags, 'session');
    const message = readTaskFile(requireFlag(flags, 'task-file'));
    const receipt = await callTool(client, 'session_send', {
      session_id: sessionId,
      message,
      delivery: flags.steer === true ? 'steer' : 'queue',
      request_id: randomUUID(),
    });
    return { session_id: receipt.session_id ?? sessionId, request_id: receipt.request_id };
  }

  if (command === 'status') {
    const sessionId = requireFlag(flags, 'session');
    const status = await callTool(client, 'session_status', {
      address: { kind: 'session', session_id: sessionId },
    });
    const turn = status.turn === null || status.turn === undefined
      ? null
      : { turn: status.turn.turn, open: status.turn.open, reason: status.turn.reason ?? null };
    return {
      session_id: status.session_id ?? sessionId,
      agent_status: status.agent_status,
      head_seq: status.head_seq,
      turn,
      queue_count: (status.queue?.length ?? 0) + (status.queue_omitted ?? 0),
      pending_approvals_count:
        (status.pending_approvals?.length ?? 0) + (status.pending_approvals_omitted ?? 0),
    };
  }

  const sessionId = requireFlag(flags, 'session');
  const requestId = requireFlag(flags, 'request');
  const waitMs = readWaitMs(flags['wait-ms']);
  const result = await callTool(client, 'turn_result', {
    address: { kind: 'session', session_id: sessionId },
    request_id: requestId,
    wait_ms: waitMs,
  });
  const compact = {
    state: result.state,
    reason: result.reason ?? null,
    final_message: result.final_message ?? null,
    diagnostics: result.diagnostics ?? [],
  };
  if (result.final_message_truncated === true) compact.final_message_truncated = true;
  if (typeof result.diagnostics_omitted === 'number') {
    compact.diagnostics_omitted = result.diagnostics_omitted;
  }
  return compact;
}

async function main(argv) {
  try {
    if (argv.length === 1 && ['--help', '-h'].includes(argv[0])) { process.stdout.write(USAGE + '\n'); return 0; }
    const { command, flags } = parseArgs(argv);
    // Validate local inputs before touching the credential or the network.
    if (command === 'start') {
      resolveCwd(requireFlag(flags, 'cwd'));
      readTaskFile(requireFlag(flags, 'task-file'));
    } else if (command === 'send') {
      requireFlag(flags, 'session');
      readTaskFile(requireFlag(flags, 'task-file'));
    } else if (command === 'status') {
      requireFlag(flags, 'session');
    } else {
      requireFlag(flags, 'session');
      requireFlag(flags, 'request');
      readWaitMs(flags['wait-ms']);
    }

    const connection = connectionConfig();
    const client = await openClient(connection);
    try {
      const output = await runCommand(client, command, flags);
      process.stdout.write(`${JSON.stringify(output)}\n`);
      return 0;
    } finally {
      // Every command, including a failed tool call, closes its MCP session.
      try {
        await client.close();
      } catch {
        // A close failure must not turn a delivered result into an error.
      }
    }
  } catch (error) {
    const code = error instanceof CliError ? error.code : 'internal';
    const message = error instanceof CliError ? errorMessage(error) : 'Internal CLI failure.';
    process.stderr.write(`${JSON.stringify({ error: { code, message } })}\n`);
    return error instanceof CliError ? error.exitCode : 1;
  }
}

export { main, parseArgs, readWaitMs, resolveCwd, readTaskFile, runCommand };
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = await main(process.argv.slice(2));
