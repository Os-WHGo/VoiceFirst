#!/usr/bin/env node
/** Read-only npm explain for selected flagged transitive packages.
 * Dependency parent paths are evidence for upgrade/override decisions.
 */
import {spawnSync} from 'node:child_process';
const names=['braces','node-forge','uuid','micromatch','metro-transform-worker','@expo/code-signing-certificates'];
for(const name of names){
 const run=spawnSync('npm',['explain',name,'--json'],{encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
 if(run.status!==0){console.error('npm explain failed for '+name+': '+(run.stderr||run.stdout||'').slice(-1500));process.exitCode=1;continue;}
 let entries;try{entries=JSON.parse(run.stdout)}catch{console.error('Invalid npm explain JSON for '+name);process.exitCode=1;continue;}
 console.log(JSON.stringify({package:name,installed:entries.map(x=>({name:x.name,version:x.version,location:x.location,parents:(x.dependents||[]).map(p=>({name:p.name,version:p.version,location:p.location,type:p.type,spec:p.spec}))}))},null,2));
}
