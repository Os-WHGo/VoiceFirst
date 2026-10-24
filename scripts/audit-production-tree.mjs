#!/usr/bin/env node
/** Compare complete vs production dependency audit, read-only. This is not
 * proof of mobile runtime reachability: Expo bundling differs from npm's tree.
 */
import {spawnSync} from 'node:child_process';
const audit=(args)=>{
 const r=spawnSync('npm',['audit','--json','--package-lock-only',...args],{
  encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024
 });
 let j;try{j=JSON.parse(r.stdout)}catch{
  throw new Error('npm audit returned non-JSON: '+(r.stderr||r.stdout||'').slice(-1000));
 }
 if(!j.metadata?.vulnerabilities||!j.vulnerabilities)throw new Error('Unexpected npm audit schema');
 return j;
};
const full=audit([]);
const prod=audit(['--omit=dev']);
const names=(j)=>new Set(Object.keys(j.vulnerabilities));
const all=names(full),p=names(prod);
const result={
 full:full.metadata.vulnerabilities,
 productionTree:prod.metadata.vulnerabilities,
 presentOnlyInFull:[...all].filter(x=>!p.has(x)).sort(),
 presentInProductionTree:[...p].sort(),
 interpretation:'npm --omit=dev is a dependency-tree classification, NOT evidence of reachability inside Android/iOS bundles.'
};
console.log(JSON.stringify(result,null,2));
