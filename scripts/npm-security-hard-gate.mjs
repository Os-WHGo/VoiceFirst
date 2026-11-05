#!/usr/bin/env node
/** Independent, fail-closed npm release gate.
 * Never interpret a known advisory or a passing baseline comparison as safe.
 * Existing Expo 57 vulnerabilities block merging/publishing until actually fixed.
 */
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const severities=['critical','high','moderate','low','info'];
export function assessReleaseAudit(raw){
 if(raw?.auditReportVersion!==2||Object.hasOwn(raw??{},'error'))
  throw Error('Unsupported or failed npm audit report');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    !raw.vulnerabilities||typeof raw.vulnerabilities!=='object'||Array.isArray(raw.vulnerabilities)||
    !raw.metadata?.vulnerabilities)throw Error('Missing or invalid npm audit report');
 const v=raw.metadata.vulnerabilities;
 for(const key of [...severities,'total'])
  if(!Number.isInteger(v[key])||v[key]<0)throw Error('Missing or invalid severity: '+key);
 const entries=Object.entries(raw.vulnerabilities);
 const urls=new Set(),roots=new Set();
 const observed=Object.fromEntries(severities.map(key=>[key,0]));
 for(const [name,entry] of entries){
  if(!entry||!severities.includes(entry.severity)||!Array.isArray(entry.via))throw Error('Malformed npm vulnerability entry: '+name);
  observed[entry.severity]++;
  for(const issue of entry.via){
   if(issue&&typeof issue==='object'){
    if(typeof issue.url!=='string'||!issue.url.startsWith('https://github.com/advisories/'))
     throw Error('Unknown advisory URL for '+name);
    urls.add(issue.url);roots.add(name);
   }
  }
 }
 const inconsistent=v.total!==entries.length||severities.some(key=>observed[key]!==v[key])||
  v.total!==severities.reduce((n,key)=>n+v[key],0)||
  (v.total===0&&entries.length>0)||(v.total>0&&entries.length===0);
 return {
  readyForMerge:v.total===0&&entries.length===0&&!inconsistent,
  inconsistent,
  affectedPackages:entries.length,totals:Object.fromEntries([...severities,'total'].map(k=>[k,v[k]])),
  rootPackages:[...roots].sort(),advisoryUrls:[...urls].sort(),
  interpretation:'Required zero-vulnerability policy. This does not certify runtime safety, mobile QA or release readiness.'
 };
}
/** Exit 1 can mean findings OR an operational error; validate both channels. */
export function readAuditResult(result){
 if(result.error||result.signal||![0,1].includes(result.status))
  throw Error('npm audit could not complete');
 let data;
 try{data=JSON.parse(result.stdout)}catch{throw Error('npm audit did not return valid JSON');}
 const report=assessReleaseAudit(data);
 if(report.inconsistent)throw Error('Inconsistent npm audit counts');
 const expected=report.affectedPackages>0?1:0;
 if(result.status!==expected)throw Error('npm audit exit status contradicts findings');
 return data;
}
function main(){
 const r=spawnSync('npm',['audit','--json','--package-lock-only'],{
  encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024
 });
 const data=readAuditResult(r);
 const report=assessReleaseAudit(data);
 console.log('Strict npm security gate:',JSON.stringify(report,null,2));
 if(!report.readyForMerge){
  console.error('BLOCKED: unresolved npm advisories or inconsistent audit results. Do not merge/publish.');
  process.exitCode=1;
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
