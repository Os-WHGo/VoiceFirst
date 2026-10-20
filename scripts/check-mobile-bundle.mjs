#!/usr/bin/env node
/** Check that Metro can package the actual app and bundled A0 JSON for both native platforms.
 * No APK/IPA, signing, EAS account, simulator or device is used.
 */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const cwd=join(root,'mobile');
const temp=mkdtempSync(join(tmpdir(),'voicefirst-metro-'));
try{
 for(const platform of ['android','ios']){
  const out=join(temp,platform);
  const run=spawnSync('npx',['--no-install','expo','export','--platform',platform,'--output-dir',out],
   {cwd,encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024,
    env:{...process.env,CI:'1',EXPO_NO_TELEMETRY:'1'}});
  if(run.status!==0){
   console.error('Metro export failed for '+platform);
   console.error((run.stdout||'').slice(-4000));
   console.error((run.stderr||'').slice(-4000));
   process.exitCode=1;break;
  }
  const names=readdirSync(out,{recursive:true}).map(String);
  if(!names.some(x=>/\.js$/.test(x))){
   console.error('Metro produced no JavaScript bundle for '+platform);
   process.exitCode=1;break;
  }
  console.log('Metro '+platform+' bundle exported successfully (not a native installable).');
 }
}finally{rmSync(temp,{recursive:true,force:true});}
