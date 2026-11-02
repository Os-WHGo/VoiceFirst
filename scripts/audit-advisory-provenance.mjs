#!/usr/bin/env node
/** Read-only check that an npm audit finding is not mistaken for a direct advisory.
 * A package can be flagged through its dependency chain (via package names).
 */
import {spawnSync} from 'node:child_process';
const r=spawnSync('npm',['audit','--json','--package-lock-only'],{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
let j;try{j=JSON.parse(r.stdout)}catch{throw Error('Invalid npm audit JSON');}
if(!j.vulnerabilities)throw Error('Missing npm audit vulnerabilities');
const rows=Object.entries(j.vulnerabilities).map(([name,v])=>{
 const advisories=(v.via||[]).filter(x=>x&&typeof x==='object').map(x=>({title:x.title,url:x.url,range:x.range}));
 const viaPackages=(v.via||[]).filter(x=>typeof x==='string');
 return {name,severity:v.severity,directAdvisoryCount:advisories.length,viaPackages,advisories};
});
const inherited=rows.filter(x=>!x.directAdvisoryCount);
console.log(JSON.stringify({totalFlaggedPackages:rows.length,packagesWithOwnAdvisories:rows.length-inherited.length,packagesFlaggedOnlyThroughDependencies:inherited.length,inherited:inherited.map(({name,severity,viaPackages})=>({name,severity,viaPackages})),note:'A flagged package with no own advisory may inherit severity from a vulnerable dependency. This is not proof of runtime exposure.'},null,2));
