#!/usr/bin/env node
/** Fail closed on newly observed advisories or a worse npm audit severity budget.
 * Baseline is a ceiling, never a target. Existing findings are NOT resolved.
 */
import {spawnSync} from 'node:child_process';
import {assessAudit} from './security-audit-policy.mjs';
const r=spawnSync('npm',['audit','--json','--package-lock-only'],{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
if(r.error)throw r.error;
let audit;try{audit=JSON.parse(r.stdout)}catch{throw Error('Invalid npm audit response: '+(r.stderr||'').slice(-400));}
const result=assessAudit(audit);
console.log(JSON.stringify(result,null,2));
if(!result.ok){console.error('Security regression detected. Existing baseline is not an acceptance of risk.');process.exitCode=1;}
