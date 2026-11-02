#!/usr/bin/env node
/** Read-only remediation targets: report leaf advisories, not 22 independent bugs. */
import {spawnSync} from 'node:child_process';
const r=spawnSync('npm',['audit','--json','--package-lock-only'],{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
let j;try{j=JSON.parse(r.stdout)}catch{throw Error('Invalid npm audit JSON');}
if(!j.vulnerabilities)throw Error('Missing npm audit vulnerabilities');
const leaves=Object.entries(j.vulnerabilities).flatMap(([name,v])=>(v.via||[]).filter(x=>typeof x==='object'&&x).map(a=>({
 package:name,severity:a.severity||v.severity,advisory:a.title,url:a.url,range:a.range,
 affectedPackageCount:Object.entries(j.vulnerabilities).filter(([,v2])=>v2.name===name||(v2.via||[]).includes(name)).length
})));
console.log(JSON.stringify({totalFlaggedPackages:Object.keys(j.vulnerabilities).length,leafAdvisories:leaves,interpretation:'Targets are npm advisory sources, not necessarily independently exploitable mobile-runtime vulnerabilities. Do not force upgrades.'},null,2));
