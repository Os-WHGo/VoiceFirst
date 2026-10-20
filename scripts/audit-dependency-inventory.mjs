#!/usr/bin/env node
/** Dependency vulnerability inventory for triage; does not mutate lockfile.
 * npm audit exits nonzero when vulnerabilities are found, so report JSON and
 * fail only if the audit itself cannot produce a parseable inventory.
 */
import {spawnSync} from 'node:child_process';
const result=spawnSync('npm',['audit','--json','--package-lock-only'],{
 encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024
});
let report;
try{report=JSON.parse(result.stdout);}catch{
 console.error('npm audit did not return JSON:',(result.stderr||result.stdout||'').slice(-1500));
 process.exit(1);
}
if(!report.metadata?.vulnerabilities||!report.vulnerabilities){
 console.error('npm audit response lacks expected vulnerability inventory.');
 process.exit(1);
}
const counts=report.metadata.vulnerabilities;
console.log('npm audit severity totals:',JSON.stringify(counts));
const findings=Object.entries(report.vulnerabilities).map(([name,item])=>({
 name,severity:item.severity,isDirect:item.isDirect,
 fixAvailable:item.fixAvailable===true?'available':item.fixAvailable===false?'none':'major-or-manual',
 via:(item.via||[]).filter(x=>typeof x==='object').map(x=>({name:x.name,range:x.range,url:x.url})).slice(0,3)
})).sort((a,b)=>({critical:0,high:1,moderate:2,low:3,info:4}[a.severity]??5)-({critical:0,high:1,moderate:2,low:3,info:4}[b.severity]??5));
console.log(JSON.stringify(findings,null,2));
console.log('Inventory only: vulnerabilities require exploitability and dependency-path review before changing versions.');
