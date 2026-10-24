#!/usr/bin/env node
/** Non-mutating security regression gate for known leaf advisories.
 * Does not claim zero vulnerabilities; fails if a new advisory source appears.
 */
import {spawnSync} from 'node:child_process';
const allowed=new Set(['braces','node-forge','uuid']);
const r=spawnSync('npm',['audit','--json','--package-lock-only'],{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
let j;try{j=JSON.parse(r.stdout)}catch{throw Error('Invalid npm audit JSON');}
if(!j.vulnerabilities)throw Error('Missing npm audit vulnerabilities');
const roots=Object.entries(j.vulnerabilities).filter(([,v])=>(v.via||[]).some(x=>typeof x==='object'&&x)).map(([name])=>name).sort();
const unexpected=roots.filter(x=>!allowed.has(x));
console.log(JSON.stringify({knownAdvisorySources:[...allowed].sort(),observedAdvisorySources:roots,unexpectedAdvisorySources:unexpected,interpretation:'Baseline regression gate only; existing security findings remain unresolved.'},null,2));
if(unexpected.length){console.error('New advisory source requires explicit security triage.');process.exit(1);}
