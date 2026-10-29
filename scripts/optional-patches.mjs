import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const repo=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const assets=path.join(repo,'third-party','patches');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>{try{return await fs.readFile(p);}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const inside=(root,p)=>{const rel=path.relative(root,p);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};

/** Exact, offline package patching. Never starts, stops or restarts a process. */
export async function patchPackage({component,root,backup,mode='check',stopped=false}){
 const manifest=JSON.parse(await fs.readFile(path.join(assets,'manifest.json'),'utf8'));
 const spec=manifest[component];
 if(!spec||!['check','apply','restore'].includes(mode))throw Error('Select genui or billion and check/apply/restore.');
 if(!root||!path.isAbsolute(root))throw Error('--root must be the absolute installed package directory.');
 root=await fs.realpath(root);
 const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 if(pkg.name!==spec.name||pkg.version!==spec.version)throw Error(`Unsupported package: requires ${spec.name} ${spec.version}; no files changed.`);
 const plan=[];
 for(const f of spec.files){
  const target=path.join(root,f.path);
  if(!inside(root,target))throw Error('Target outside package.');
  const parent=await fs.realpath(path.dirname(target));
  if(!inside(root,parent))throw Error('Target directory resolves outside package.');
  const stat=await fs.lstat(target).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(stat?.isSymbolicLink())throw Error('Target file is a symlink; inspect installation manually.');
  if(stat?.nlink>1)throw Error('Target file has hard links; use an independent package copy before patching.');
  const current=await read(target),hash=current===null?null:sha(current);
  if(hash!==f.before&&hash!==f.after)throw Error(`Unrecognized bytes: ${f.path}. This version may already differ; no files changed.`);
  plan.push({spec:f,target,current,hash});
 }
 const original=plan.every(x=>x.hash===x.spec.before),patched=plan.every(x=>x.hash===x.spec.after);
 if(!original&&!patched)throw Error('Mixed patch state; inspect previous backup before proceeding.');
 if(mode==='check')return {component,version:pkg.version,state:patched?'patched':'applicable',changed:false,restart:false};
 if(!stopped)throw Error('User must manually stop affected software first; pass --stopped only after confirmation.');
 if(mode==='apply'&&patched)return {component,state:'already-patched',changed:false,restart:false};
 if(mode==='restore'&&original)return {component,state:'already-original',changed:false,restart:false};
 if(!backup||!path.isAbsolute(backup))throw Error('--backup requires an absolute private directory outside the package and this repository.');
 backup=path.resolve(backup);
 const backupParent=await fs.realpath(path.dirname(backup));
 backup=path.join(backupParent,path.basename(backup));
 if(inside(root,backup)||inside(repo,backup)||inside(backup,root))throw Error('Backup must be separate from package and publication directory.');
 const replacements=[];
 if(mode==='apply'){
  for(const p of plan){
   const f=p.spec;let output;
   if(f.asset)output=await fs.readFile(path.join(assets,f.asset));
   else{
    const source=p.current.toString('utf8');
    const outer=f.region?source.indexOf(f.region.outer):0;
    const start=f.region?source.indexOf(f.region.start,outer):0;
    const end=f.region?source.indexOf(f.region.end,start):source.length;
    if(outer<0||start<0||end<start)throw Error('Patch boundary not found.');
    let block=source.slice(start,end);
    for(const edit of f.changes){if(block.split(edit.before).length!==2)throw Error('Patch anchor is not unique.');block=block.replace(edit.before,edit.after);}
    output=Buffer.from(source.slice(0,start)+block+source.slice(end));
   }
   if(sha(output)!==f.after)throw Error('Patched hash mismatch: '+f.path);
   replacements.push({...p,output});
  }
  await fs.mkdir(backup); // Refuse overwriting any existing backup.
  for(const p of plan)if(p.current!==null){const dest=path.join(backup,p.spec.path);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,p.current,{flag:'wx'});}
  await fs.writeFile(path.join(backup,'receipt.json'),JSON.stringify({component,root,version:pkg.version,files:spec.files.map(f=>({path:f.path,before:f.before,after:f.after}))},null,2),{flag:'wx'});
 }else{
  const receipt=JSON.parse(await fs.readFile(path.join(backup,'receipt.json'),'utf8'));
  if(receipt.component!==component||receipt.root!==root||receipt.version!==pkg.version)throw Error('Backup belongs to another installation.');
  for(const p of plan){const output=p.spec.before===null?null:await fs.readFile(path.join(backup,p.spec.path));if((output===null?null:sha(output))!==p.spec.before)throw Error('Backup hash mismatch.');replacements.push({...p,output});}
 }
 const written=[];
 try{
  for(const p of replacements){const actual=await read(p.target);if((actual===null?null:sha(actual))!==p.hash)throw Error('File changed since check: '+p.spec.path);written.push(p);if(p.output===null)await fs.unlink(p.target);else await fs.writeFile(p.target,p.output);}
 }catch(error){
  for(const p of written.reverse()){if(p.current===null)await fs.unlink(p.target).catch(e=>{if(e.code!=='ENOENT')throw e;});else await fs.writeFile(p.target,p.current);}
  throw error;
 }
 for(const p of replacements){const actual=await read(p.target);if((actual===null?null:sha(actual))!==(p.output===null?null:sha(p.output)))throw Error('Readback failed: '+p.spec.path);}
 return {component,state:mode==='apply'?'patched':'restored',changed:true,files:replacements.map(p=>p.spec.path),next:'User manually starts affected software and verifies loaded version. This script never restarts.'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const args=process.argv.slice(2),options={};
  if(args.includes('--help'))console.log('node scripts/optional-patches.mjs --component genui|billion --root <installed-package> [--apply|--restore --stopped --backup <private-new-directory>]\nDefault: read-only check. User must manually stop/start software. Exact versions and file hashes only.');
  else{
   let action=false;
   for(let i=0;i<args.length;i++){const key=args[i];if(['--component','--root','--backup'].includes(key)&&args[i+1]&&!args[i+1].startsWith('--'))options[key.slice(2)]=args[++i];else if(key==='--stopped')options.stopped=true;else if(['--apply','--restore'].includes(key)&&!action){options.mode=key.slice(2);action=true;}else throw Error('Unknown, duplicate or missing option: '+key);}
   console.log(JSON.stringify(await patchPackage(options),null,2));
  }
 }catch(e){console.error(JSON.stringify({error:e.message}));process.exitCode=1;}
}
