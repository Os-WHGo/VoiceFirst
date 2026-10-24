#!/usr/bin/env node
/** Validate Expo's resolved app configuration without Apple signing, Android SDK,
 * installing a device build, app-store publishing or EAS cloud usage.
 */
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mobile=join(root,'mobile');
const result=spawnSync('npx',['--no-install','expo','config','--type','public','--json'],
  {cwd:mobile,encoding:'utf8',timeout:120_000,maxBuffer:5*1024*1024});
if(result.status!==0){
 console.error('Expo config resolution failed:',result.stderr?.slice(-2500)||result.error?.message||result.status);
 process.exit(1);
}
let config;
try{config=JSON.parse(result.stdout);}catch{
 console.error('Expo returned invalid JSON config.');process.exit(1);
}
const expected=resolve(mobile);
if(config.slug!=='voicefirst-learning'||config.ios?.bundleIdentifier!=='com.oswhgo.voicefirst'
 ||config.android?.package!=='com.oswhgo.voicefirst'||config.version!=='0.1.0')
 {console.error('Native app identifiers or version differ from the audited prototype.',JSON.stringify({
 slug:config.slug,ios:config.ios?.bundleIdentifier,android:config.android?.package,version:config.version}));process.exit(1);}
if(!config.ios?.supportsTablet) {console.error('Tablet support unexpectedly disabled.');process.exit(1);}
console.log('Expo public configuration resolved: VoiceFirst 0.1.0, iOS/Android preview identifiers, tablet enabled.');
console.log('This does NOT mean a native IPA/APK, device test or app-store submission exists.');
