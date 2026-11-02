#!/usr/bin/env node
/** Read-only audit triage: distinguish direct and transitive findings.
 * npm's dependency graph is not equivalent to mobile runtime reachability.
 */
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
const direct=new Set();
for(const [path,entry] of Object.entries(lock.packages||{})){
 if(path===''||path==='mobile'||path==='packages/core'){
  for(const name of Object.keys({...entry.dependencies,...entry.devDependencies,...entry.optionalDependencies}))direct.add(name);
 }
}
const result=spawnSync('npm',['audit','--json','--package-lock-only'],{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
let audit;try{audit=JSON.parse(result.stdout)}catch{throw Error('Unable to parse npm audit response');}
if(!audit.vulnerabilities||!audit.metadata?.vulnerabilities)throw Error('Unexpected npm audit response');
const findings=Object.entries(audit.vulnerabilities).map(([name,v])=>({
 name,severity:v.severity,relationship:direct.has(name)?'direct':'transitive',
 installedVersions:Object.entries(lock.packages||{}).filter(([path])=>path.endsWith('/node_modules/'+name)||path==='node_modules/'+name).map(([,e])=>e.version).filter(Boolean),
 remediation:v.fixAvailable===true?'reported-available':v.fixAvailable?'requires-review':'not-reported',
 advisoryCount:(v.via||[]).filter(x=>typeof x==='object').length
})).sort((a,b)=>a.relationship.localeCompare(b.relationship)||a.name.localeCompare(b.name));
const groups={direct:findings.filter(x=>x.relationship==='direct'),transitive:findings.filter(x=>x.relationship==='transitive')};
console.log(JSON.stringify({totals:audit.metadata.vulnerabilities,groups,notes:[
 'Direct means listed in a workspace manifest; it does not prove a vulnerability is exploitable in the app.',
 'Transitive findings can still matter for build integrity or runtime.',
 'No dependencies were modified; remediation requires Expo/React Native compatibility and CI verification.'
]},null,2));
