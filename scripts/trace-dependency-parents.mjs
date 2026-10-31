#!/usr/bin/env node
/** Read-only lockfile dependency parent tracing for npm workspaces.
 * Usage: node scripts/trace-dependency-parents.mjs zod minimatch
 * No npm install, no network, no mutations.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const lockPath=resolve(fileURLToPath(new URL('../package-lock.json',import.meta.url)));
const lock=JSON.parse(readFileSync(lockPath,'utf8'));
if(lock.lockfileVersion!==3||!lock.packages||typeof lock.packages!=='object'){
  throw new Error('Expected npm lockfile v3 packages');
}
const requested=process.argv.slice(2);
if(requested.length===0||requested.some(x=>!/^[a-zA-Z0-9@._/-]+$/.test(x))){
  console.error('Usage: node scripts/trace-dependency-parents.mjs <package> [package...]');
  process.exitCode=2;
}else{
  const result=requested.map(name=>{
    const installed=Object.entries(lock.packages)
      .filter(([path])=>path===`node_modules/${name}`||path.endsWith(`/node_modules/${name}`))
      .map(([path,pkg])=>({path,version:pkg.version??null}));
    const parents=Object.entries(lock.packages).flatMap(([path,pkg])=>{
      const fields=['dependencies','optionalDependencies','peerDependencies'];
      return fields.flatMap(field=>pkg[field]?.[name]
        ?[{path:path||'(workspace root)',version:pkg.version??null,field,range:pkg[field][name]}]
        :[]);
    });
    return {name,installed,parents};
  });
  console.log(JSON.stringify({lockfileVersion:lock.lockfileVersion,packages:result},null,2));
  if(result.some(x=>x.installed.length===0))process.exitCode=1;
}
