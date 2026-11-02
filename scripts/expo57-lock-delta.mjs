#!/usr/bin/env node
/** Deterministic lockfile delta for an authorized patch trial in a CI runner.
 * Prints only public npm lockfile metadata; never credentials or package files.
 * Reconstruct it with the original lockfile, not from a guessed npm version.
 */
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const text=readFileSync(new URL('../package-lock.json',import.meta.url),'utf8');
const old=spawnSync('git',['show','HEAD:package-lock.json'],{encoding:'utf8',timeout:10000,maxBuffer:10*1024*1024});
if(old.error||old.status!==0)throw Error('Cannot read pristine committed lockfile');
const before=JSON.parse(old.stdout),after=JSON.parse(text);
if(before.lockfileVersion!==3||after.lockfileVersion!==3)throw Error('Expected npm lockfile v3');
const changed=[];
for(const key of new Set([...Object.keys(before.packages),...Object.keys(after.packages)])){
 const a=before.packages[key]??null,b=after.packages[key]??null;
 if(JSON.stringify(a)!==JSON.stringify(b))changed.push({path:key,entry:b});
}
changed.sort((a,b)=>a.path.localeCompare(b.path));
const rootFields=['name','version','lockfileVersion','requires'];
for(const field of rootFields){
 if(JSON.stringify(before[field])!==JSON.stringify(after[field]))
  throw Error('Unexpected root lockfile metadata update: '+field);
}
const sha=x=>createHash('sha256').update(x,'utf8').digest('hex');
const body=JSON.stringify({baselineSha256:sha(old.stdout),updatedSha256:sha(text),
 changeCount:changed.length,packageCountBefore:Object.keys(before.packages).length,
 packageCountAfter:Object.keys(after.packages).length,changed});
if(body.length>300000)throw Error('Unexpectedly large lockfile delta');
const chunkSize=2800;
const total=Math.ceil(body.length/chunkSize);
console.log('VOICEFIRST_LOCK_DELTA_BEGIN count='+total+' bytes='+body.length);
for(let i=0;i<total;i++)
 console.log('VOICEFIRST_LOCK_DELTA_CHUNK '+(i+1)+'/'+total+' '+body.slice(i*chunkSize,(i+1)*chunkSize));
console.log('VOICEFIRST_LOCK_DELTA_END');
