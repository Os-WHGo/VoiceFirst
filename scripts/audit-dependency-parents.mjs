#!/usr/bin/env node
/** Trace vulnerable dependency parents. Optional historical roots can disappear
 * after a compatible upstream patch; that MUST NOT mask a failing installed root.
 * The npm audit hard gate independently rejects all remaining known advisories.
 */
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const roots=Object.freeze([
 'deepmerge','glob','minimatch','uuid','zod','braces','node-forge',
 'micromatch','metro-transform-worker','@expo/code-signing-certificates'
]);
export function installedLocations(lock,name){
 if(lock?.lockfileVersion!==3||!lock.packages||typeof lock.packages!=='object')
  throw Error('Expected npm package-lock v3');
 if(typeof name!=='string'||!name||name.includes('..'))
  throw Error('Invalid dependency name');
 return Object.entries(lock.packages).filter(([path])=>
  path==='node_modules/'+name||path.endsWith('/node_modules/'+name))
  .map(([path,entry])=>({path,version:entry.version??null}));
}
export function reverseParents(lock,name){
 return Object.entries(lock.packages).filter(([path,p])=>
  path&&p&&typeof p==='object'&&Object.hasOwn(p.dependencies||{},name))
  .map(([parentPath,p])=>({parentPath,parentVersion:p.version||null,required:p.dependencies[name]}));
}
export function classifyExplainTarget(lock,name){
 const installed=installedLocations(lock,name),parents=reverseParents(lock,name);
 return {package:name,installed,lockfileParents:parents,
  status:installed.length?'installed':parents.length?'invalid-missing-required':'not-installed'};
}
function run(){
 const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
 for(const name of roots){
  const target=classifyExplainTarget(lock,name);
  if(target.status==='not-installed'){
   console.log(JSON.stringify({...target,note:'Removed or absent dependency: no npm explain needed.'}));
   continue;
  }
  if(target.status==='invalid-missing-required'){
   console.error('Referenced dependency missing from lockfile: '+name);
   process.exitCode=1;continue;
  }
  const result=spawnSync('npm',['explain',name,'--json'],{
   encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024
  });
  if(result.error||result.status!==0){
   console.error('npm explain failed for installed '+name+': '+String(result.error||result.stderr||result.stdout).slice(-700));
   process.exitCode=1;continue;
  }
  let explained;
  try{explained=JSON.parse(result.stdout);if(!Array.isArray(explained))throw Error('Expected array');}
  catch{console.error('Invalid npm explain output for installed '+name);process.exitCode=1;continue;}
  console.log(JSON.stringify({...target,explain:explained.map(item=>({
   name:item.name,version:item.version,location:item.location,
   parents:(item.dependents||[]).map(p=>({name:p.name,version:p.version,location:p.location,type:p.type,spec:p.spec}))
  }))},null,2));
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))run();
