/** Compile native B0 sources only after changes to native-sensitive files.
 * GitHub PR path filters compare the entire PR against main. This additional
 * gate considers just the commits in the current synchronize delivery.
 * Unknown/invalid revisions always request compilation (fail safe).
 */
import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const sha=/^[0-9a-f]{40}$/;
export function requiresNativeCompile(files){
 if(!Array.isArray(files)||!files.every(f=>typeof f==='string'&&f.length>0))return true;
 return files.some(f=>
  f.startsWith('mobile/')||
  // Explicit batching marker: request one native compile without touching source.
  f==='docs/ci/native-batch-request.md'||
  f==='package.json'||f==='package-lock.json'||
  f==='.github/workflows/expo-native-readiness.yml'||
  f==='scripts/native-ci-change-gate.mjs'||
  f==='scripts/check-ios-startup-screen.swift'||
  /^scripts\/(?:check-android|check-ios|check-expo|inspect-android|verify-android)/.test(f)
 );
}
export function inspectNativeChange({eventName,action,before,after},git=(args)=>execFileSync('git',args,{encoding:'utf8',timeout:20000})){
 if(eventName!=='pull_request'||action!=='synchronize')return {required:true,reason:'initial-or-manual'};
 if(!sha.test(before??'')||!sha.test(after??''))return {required:true,reason:'missing-commit'};
 try{
  git(['cat-file','-e',before+'^{commit}']);
  git(['cat-file','-e',after+'^{commit}']);
  const names=git(['diff','--name-only','--no-renames',before,after]).trim();
  if(typeof names!=='string')return {required:true,reason:'invalid-diff'};
  const paths=names?names.split(/\r?\n/):[];
  return {required:requiresNativeCompile(paths),reason:'validated-commit-diff',changed:paths.length};
 }catch{return {required:true,reason:'unavailable-history'};}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const outcome=inspectNativeChange({eventName:process.env.GITHUB_EVENT_NAME,action:process.env.PR_ACTION,before:process.env.PR_BEFORE,after:process.env.PR_AFTER});
 console.log(JSON.stringify(outcome));
 if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`required=${outcome.required}\n`);
 else process.exitCode=2; // Do not silently report an unguarded CI result.
}
