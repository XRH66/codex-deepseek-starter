import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';
import { configure, repoRoot } from '../scripts/configure.mjs';
import { connectionConfig, readWaitMs } from '../scripts/dsh-cli.mjs';

const exec = promisify(execFile);
const cli = path.join(repoRoot, 'scripts', 'dsh-cli.mjs');

test('configuration generation is outside the repo, coherent, secret-free and refuses existing output', async () => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-config-'));
  try {
    const controlRoot=path.join(base,'control with spaces');
    await fs.mkdir(path.join(controlRoot,'lib'),{recursive:true});
    await fs.writeFile(path.join(controlRoot,'lib','index.js'),'// mock external checkout');
    const out=path.join(base,'deployment with spaces');
    const result=configure({out,controlRoot,withMemory:true});
    assert.equal(result.deployed,false);
    const overlay=parseYaml(await fs.readFile(path.join(out,'dsh.patch.yml'),'utf8'));
    const paths=JSON.parse(await fs.readFile(path.join(out,'paths.json'),'utf8'));
    const mcp=JSON.parse(await fs.readFile(path.join(out,'basic-memory.mcp.json'),'utf8'));
    const codex=parseToml(await fs.readFile(path.join(out,'codex.mcp.toml'),'utf8'));
    assert.equal(overlay[1].config.vaultPath,paths.vault);
    assert.equal(overlay[2].config.selfProfilePath,paths.selfProfile);
    assert.equal(overlay[2].config.memoryStatusDirectory,path.join(paths.management,'memory-status'));
    assert.equal(mcp.mcpServers.basic_memory.command,'basic-memory');
    assert.equal(mcp.mcpServers.basic_memory.transport,'stdio','pinned session-settings skips entries without an explicit stdio transport');
    assert.equal(mcp.mcpServers.basic_memory.env.BASIC_MEMORY_CONFIG_DIR,path.join(out,'basic-memory-state'));
    assert.equal(codex.mcp_servers.dsh_harness.bearer_token_env_var,'DSH_MCP_CONTROL_TOKEN');
    assert.match(overlay[0].insert[0].name,/^file:/);
    assert.throws(()=>configure({out,controlRoot}),/already exists/);
    assert.throws(()=>configure({out:path.join(repoRoot,'generated'),controlRoot}),/outside/);
    assert.throws(()=>configure({out:'relative',controlRoot}),/absolute/);
    assert.equal(await fs.stat(paths.vault).then(()=>true,()=>false),false,'generation must not create a live vault');
  } finally { await fs.rm(base,{recursive:true,force:true}); }
});

test('TOML URL and environment credentials agree; disallow remote endpoints and oversized waits', async () => {
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'starter-auth-'));
  try {
    const file=path.join(base,'config.toml');
    await fs.writeFile(file,'[mcp_servers.dsh_harness]\nurl="http://127.0.0.1:8931/mcp"\nbearer_token_env_var="TEST_MCP_TOKEN"\n');
    const token=randomBytes(16).toString('hex');
    const env={DSH_CODEX_CONFIG:file,TEST_MCP_TOKEN:token};
    const value=connectionConfig(env);
    assert.equal(value.authorization,'Bearer '+token);
    assert.equal(value.url,'http://127.0.0.1:8931/mcp');
    assert.equal(connectionConfig({...env,DSH_MCP_CONTROL_TOKEN:token}).url,value.url);
    assert.throws(()=>connectionConfig({...env,DSH_MCP_URL:'https://example.com/mcp'}),/loopback/);
    assert.throws(()=>connectionConfig({...env,DSH_MCP_URL:'http://127.0.0.1:8931/mcp?token=placeholder'}),/loopback/);
    assert.throws(()=>connectionConfig({DSH_CODEX_CONFIG:file}),/token environment/);
    for(const value of ['20001','-1','1.5','9007199254740992']) assert.throws(()=>readWaitMs(value),/0 to 20000/);
    assert.equal(readWaitMs('0'),0); assert.equal(readWaitMs('20000'),20000);
  } finally { await fs.rm(base,{recursive:true,force:true}); }
});

test('portable CLI performs start/send/status/result through a real local mock MCP transport', async () => {
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'starter-transport-'));
  const token=randomBytes(20).toString('hex');
  const calls=[];
  const server=createServer(async(req,res)=>{
    assert.equal(req.headers.authorization,'Bearer '+token);
    let body='';for await(const chunk of req)body+=chunk;
    const msg=body ? JSON.parse(body) : {};
    if(msg.id===undefined){res.writeHead(202);res.end();return;}
    let result;
    if(msg.method==='initialize') result={protocolVersion:msg.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'local-test-only',version:'1'}};
    else if(msg.method==='tools/call') {
      calls.push(msg.params);
      const name=msg.params.name;
      const payload=name==='session_start'||name==='session_send' ? {session_id:'session-fixture-primary',request_id:msg.params.arguments.request_id} : name==='session_status' ? {session_id:'session-fixture-primary',agent_status:'idle',head_seq:3,turn:{turn:1,open:false,reason:{kind:'completed'}},queue:[],pending_approvals:[]} : {state:'ended',reason:{kind:'completed'},final_message:'MOCK_OK',diagnostics:[]};
      result={content:[{type:'text',text:JSON.stringify(payload)}],structuredContent:payload};
    } else throw new Error('Unexpected mock method: '+msg.method);
    res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({jsonrpc:'2.0',id:msg.id,result}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const env={...process.env,DSH_MCP_CONTROL_TOKEN:token,DSH_MCP_URL:`http://127.0.0.1:${server.address().port}/mcp`,DSH_CODEX_CONFIG:path.join(base,'absent.toml')};
  const run=async args=>{const r=await exec(process.execPath,[cli,...args],{env});assert.equal(r.stderr,'');assert.equal(r.stdout.trim().split('\n').length,1);assert.ok(!r.stdout.includes(token));return JSON.parse(r.stdout);};
  try {
    const task=path.join(base,'task.md');await fs.writeFile(task,'\ufeff目标：只执行虚构验收任务');
    const receipt=await run(['start','--cwd',base,'--task-file',task]);
    assert.equal(receipt.session_id,'session-fixture-primary');
    assert.equal(calls[0].arguments.permission_preset,'danger-full-access');
    assert.equal(calls[0].arguments.prompt,'目标：只执行虚构验收任务');
    await run(['send','--session',receipt.session_id,'--task-file',task]);
    assert.equal(calls[1].arguments.delivery,'queue');
    const status=await run(['status','--session',receipt.session_id]);assert.equal(status.queue_count,0);
    const result=await run(['result','--session',receipt.session_id,'--request',receipt.request_id,'--wait-ms','0']);
    assert.equal(result.final_message,'MOCK_OK');assert.equal(calls[3].arguments.wait_ms,0);
    await assert.rejects(exec(process.execPath,[cli,'result','--session','fixture','--request','fixture','--wait-ms','20001'],{env}),error=>{assert.equal(error.code,2);assert.equal(error.stdout,'');assert.ok(!error.stderr.includes(token));assert.equal(JSON.parse(error.stderr).error.code,'usage');return true;});
    assert.equal(calls.length,4,'invalid local input must not call MCP');
  } finally {await new Promise(resolve=>server.close(resolve));await fs.rm(base,{recursive:true,force:true});}
});
