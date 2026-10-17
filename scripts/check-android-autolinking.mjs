#!/usr/bin/env node
/** Validate native Expo module autolinking metadata before Gradle starts.
 * Reads the actual Android resolve output, not the JS TypeScript representation.
 */
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const r=spawnSync('npx',['--no-install','expo-modules-autolinking','resolve','--platform','android','--json'],
  {cwd:join(root,'mobile'),encoding:'utf8',timeout:120000,maxBuffer:10*1024*1024});
if(r.status!==0){console.error('Expo autolinking resolve failed:',(r.stderr||r.stdout||'').slice(-3000));process.exit(1);}
let output;
try{output=JSON.parse(r.stdout);}catch{console.error('Autolinking output was not JSON:',r.stdout.slice(0,1000));process.exit(1);}
if(!Array.isArray(output.modules)){console.error('Unexpected Expo autolinking schema:',Object.keys(output));process.exit(1);}
const invalid=[];
for(const [index,module] of output.modules.entries()){
 const paths=(module.projects||[]).map((p,i)=>({index:i,path:p.path,
   publication:p.publication??null}));
 console.log('Native Expo module',index,JSON.stringify({name:module.packageName||module.name,paths}));
 for(const [j,project] of (module.projects||[]).entries()){
  if(project.publication && (typeof project.publication.version!=='string'||!project.publication.version))
   invalid.push({index,project:j,package:module.packageName||module.name,publication:project.publication});
 }
}
if(invalid.length){console.error('Invalid Gradle publication metadata detected:',JSON.stringify(invalid));process.exit(1);}
console.log('Native Android Expo autolinking metadata has valid publication versions.');
