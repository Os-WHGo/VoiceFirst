#!/usr/bin/env node
/** Reproducible, NON-PROMOTING Expo SDK 57 patch experiment.
 * Run in an ephemeral CI checkout only:
 *   node scripts/expo57-security-trial.mjs before
 *   npm update --workspace mobile --package-lock-only --ignore-scripts --no-audit --no-fund
 *   node scripts/expo57-security-trial.mjs after
 * Never writes a baseline, exception list or committed package manifest.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';

export const monitored=['expo','@expo/cli','@expo/config','@expo/config-plugins',
 '@expo/fingerprint','@expo/metro-config','react-native','zod','glob',
 'minimatch','deepmerge','uuid'];

export function versionNumbers(version){
 if(typeof version!=='string'||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:[-+].*)?$/.test(version))
  throw Error('Invalid package version '+String(version));
 return version.split(/[.+-]/).slice(0,3).map(Number);
}
export function snapshot(lock,audit){
 if(lock?.lockfileVersion!==3||!lock.packages||typeof lock.packages!=='object')
  throw Error('Expected npm lockfile v3');
 if(!audit?.metadata?.vulnerabilities||!audit.vulnerabilities)
  throw Error('Invalid audit response');
 const installed=Object.fromEntries(monitored.map(name=>{
  const entry=lock.packages['node_modules/'+name];
  // Optional transitive packages can genuinely disappear after an upstream
  // patch. That is a potentially GOOD result, not a malformed lockfile.
  return [name,entry?.version??null];
 }));
 for(const critical of ['expo','@expo/cli','@expo/config','@expo/config-plugins',
  '@expo/fingerprint','@expo/metro-config','react-native']){
  if(!installed[critical])throw Error('Missing essential SDK component '+critical);
 }
 const roots=Object.entries(audit.vulnerabilities).filter(([,data])=>
  Array.isArray(data?.via)&&data.via.some(item=>item&&typeof item==='object'));
 const advisories=[...new Set(roots.flatMap(([,data])=>data.via
  .filter(item=>item&&typeof item==='object').map(item=>item.url)))].sort();
 if(advisories.some(url=>typeof url!=='string'||!url.startsWith('https://github.com/advisories/')))
  throw Error('Unknown npm security advisory URL');
 const counts=audit.metadata.vulnerabilities;
 for(const severity of ['critical','high','moderate','low','total']){
  if(!Number.isInteger(counts[severity])||counts[severity]<0)throw Error('Invalid severity count '+severity);
 }
 return {installed,counts:Object.fromEntries(['critical','high','moderate','low','total']
  .map(key=>[key,counts[key]])),advisories,roots:roots.map(([name])=>name).sort()};
}
export function compareSnapshots(before,after){
 for(const name of monitored){
  const a=before.installed[name],b=after.installed[name];
  if(a!==null&&a!==undefined)versionNumbers(a);
  if(b!==null&&b!==undefined)versionNumbers(b);
 }
 const allowedSdk=(pkg,major)=>versionNumbers(pkg)[0]===major;
 if(!allowedSdk(after.installed.expo,57)||!allowedSdk(after.installed['@expo/cli'],57)||
    !allowedSdk(after.installed['@expo/config'],57)||
    !allowedSdk(after.installed['@expo/config-plugins'],57)||
    !allowedSdk(after.installed['@expo/metro-config'],57)||
    !allowedSdk(after.installed['react-native'],0)||
    versionNumbers(after.installed['react-native'])[1]!==86)
  throw Error('Trial escaped supported Expo 57 / React Native 0.86 architecture');
 const changed=monitored.filter(name=>before.installed[name]!==after.installed[name])
  .map(name=>({package:name,before:before.installed[name],after:after.installed[name]}));
 const resolved=before.advisories.filter(url=>!after.advisories.includes(url));
 const newAdvisories=after.advisories.filter(url=>!before.advisories.includes(url));
 const delta=Object.fromEntries(['critical','high','moderate','low','total']
  .map(key=>[key,after.counts[key]-before.counts[key]]));
 return {
  changed,delta,resolved,newAdvisories,remaining:after.advisories,
  clean:after.counts.total===0&&after.advisories.length===0,
  improved:resolved.length>0||after.counts.total<before.counts.total,
  regression:newAdvisories.length>0||['critical','high','moderate','low'].some(k=>delta[k]>0),
  interpretation:'CI-only patch trial, NOT a lockfile promotion or security release authorization.'
 };
}
function auditNow(){
 const run=spawnSync('npm',['audit','--json','--package-lock-only'],
  {encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024});
 if(run.error)throw run.error;
 // npm audit returns status 1 for findings; that is expected here.
 if(run.status!==0&&run.status!==1)throw Error('npm audit unavailable '+(run.stderr||'').slice(-400));
 try{return JSON.parse(run.stdout);}catch{throw Error('npm audit did not provide JSON');}
}
function currentSnapshot(){
 const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
 return snapshot(lock,auditNow());
}
if(process.argv[1]?.endsWith('/expo57-security-trial.mjs')){
 const mode=process.argv[2];
 const state=process.env.RUNNER_TEMP?join(process.env.RUNNER_TEMP,'voicefirst-expo57-trial-baseline.json'):null;
 if(!state||!['before','after'].includes(mode))throw Error('Run before/after on an ephemeral CI runner');
 if(mode==='before'){
  const before=currentSnapshot();
  writeFileSync(state,JSON.stringify(before),'utf8');
  console.log('Expo 57 patch trial BEFORE:',JSON.stringify(before,null,2));
 }else{
  const before=JSON.parse(readFileSync(state,'utf8'));
  const after=currentSnapshot();
  const comparison=compareSnapshots(before,after);
  console.log('Expo 57 patch trial AFTER:',JSON.stringify(after,null,2));
  console.log('Expo 57 patch trial COMPARISON:',JSON.stringify(comparison,null,2));
  if(comparison.regression)throw Error('Security patch trial worsened findings: do NOT promote lockfile');
  if(!comparison.clean)console.log('SECURITY STILL BLOCKED: npm vulnerabilities remain. No exception was granted.');
  if(!comparison.improved)console.log('No evidence of advisory remediation from compatible patch updates.');
 }
}
