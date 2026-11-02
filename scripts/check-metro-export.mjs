#!/usr/bin/env node
/** Bundle the actual mobile entrypoint for both platforms, without native signing or publishing. */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readdirSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mobile=join(root,'mobile');
const destination=mkdtempSync(join(tmpdir(),'voicefirst-metro-check-'));
const env={...process.env,CI:'1',EXPO_NO_TELEMETRY:'1'};
try {
 const run=spawnSync('npx',['--no-install','expo','export','--platform','all','--output-dir',destination],
  {cwd:mobile,env,encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024});
 if(run.status!==0){
  console.error('Expo Metro export failed.');console.error((run.stdout||'').slice(-4000));console.error((run.stderr||'').slice(-4000));
  process.exitCode=1;
 }else{
  const walk=(dir)=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
  const files=walk(destination);
  const bundles=files.filter(p=>/\.(js|hbc)$/.test(p)&&statSync(p).size>1000);
  if(bundles.length<2){console.error('Expected at least two nonempty platform bundles; found '+bundles.length);process.exitCode=1;}
  else console.log('Metro exported nonempty bundles for both platforms. Files: '+bundles.length);
  console.log('This does NOT build APK/IPA or validate devices, microphone or SQLite runtime.');
 }
}finally{rmSync(destination,{recursive:true,force:true});}
