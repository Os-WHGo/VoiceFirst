#!/usr/bin/env node
/** Opt-in native compatibility probe. Never runs in standard CI.
 * Requires explicit --allow-native-download because llama.rn's postinstall
 * retrieves release binaries. Does not modify package.json or lockfile. */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,cpSync,rmSync,existsSync,copyFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const args=new Set(process.argv.slice(2));
if(!args.has('--allow-native-download')){
 console.error('Opt-in only: pass --allow-native-download to permit fetching llama.rn native binaries.');process.exit(2);
}
if(args.has('--ios')){console.error('iOS probe requires a separately audited macOS build.');process.exit(2);}
const version=process.env.VOICEFIRST_LLAMA_RN_VERSION;
if(!version||!/^(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[a-zA-Z0-9.-]+)?$/.test(version)){console.error('Set VOICEFIRST_LLAMA_RN_VERSION to an audited exact version');process.exit(2);}
const temp=mkdtempSync(join(tmpdir(),'voicefirst-llama-probe-'));
const run=(cmd,argv,cwd)=>{const r=spawnSync(cmd,argv,{cwd,stdio:'inherit',env:{...process.env,CI:'1',EXPO_NO_TELEMETRY:'1'},timeout:1200000});if(r.status!==0)throw Error(cmd+' failed: '+String(r.status));};
try{
 // Keep working tree and protected main untouched. A temporary monorepo
 // ensures dependency resolution matches the actual Expo workspace.
 cpSync(join(root,'package.json'),join(temp,'package.json'));
 if(existsSync(join(root,'package-lock.json')))cpSync(join(root,'package-lock.json'),join(temp,'package-lock.json'));
 cpSync(join(root,'packages'),join(temp,'packages'),{recursive:true,filter:p=>!p.includes('/node_modules')&&!p.includes('/dist')});
 cpSync(join(root,'mobile'),join(temp,'mobile'),{recursive:true,filter:p=>!p.includes('/node_modules')&&!p.includes('/android')&&!p.includes('/ios')});
 run('npm',['install','--ignore-scripts'],temp);
 // Version must be pinned by the investigator, not resolved implicitly to latest.
 run('npm',['install','--workspace','mobile','--save-exact','llama.rn@'+version],temp);
 run('npx',['--no-install','expo','prebuild','--platform','android','--no-install','--clean'],join(temp,'mobile'));
 run('node',['-e',"const fs=require('fs');const p='mobile/android/settings.gradle';if(!fs.existsSync(p))process.exit(1);"],temp);
 if(args.has('--assemble-debug')){
  const android=join(temp,'mobile','android');
  run('./gradlew',[':app:assembleDebug','--no-daemon'],android);
  const apk=join(android,'app','build','outputs','apk','debug','app-debug.apk');
  if(!existsSync(apk))throw Error('Gradle finished without an APK');
  const destination=process.env.VOICEFIRST_LLAMA_PROBE_OUTPUT;
  if(destination){
   const target=resolve(destination);
   mkdirSync(join(target,'..'),{recursive:true});copyFileSync(apk,target);
   console.log('Experimental debug APK copied to:',target);
  }
  console.log('Native Android debug APK assembled; physical device inference still unverified.');
 }else console.log('Native Android prebuild completed. For actual native compilation add --assemble-debug.');
}finally{rmSync(temp,{recursive:true,force:true});}
