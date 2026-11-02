#!/usr/bin/env node
/** Generate and inspect Android native source in CI. No APK, SDK build,
 * signing key, account, store publishing or EAS services are used.
 */
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mobile=join(root,'mobile');
const env={...process.env,EXPO_NO_TELEMETRY:'1',EXPO_NO_GIT_STATUS:'1',CI:'1'};
const build=spawnSync('npx',['--no-install','expo','prebuild','--platform','android','--no-install','--clean'],
  {cwd:mobile,env,encoding:'utf8',timeout:180000,maxBuffer:3*1024*1024});
if(build.status!==0){
 console.error('Android Expo prebuild failed. Native source has not been accepted.');
 console.error((build.stdout||'').slice(-3000));
 console.error((build.stderr||'').slice(-3000));
 process.exit(1);
}
const app=join(mobile,'android','app');
const manifestPath=join(app,'src','main','AndroidManifest.xml');
const gradlePath=join(app,'build.gradle');
if(!existsSync(manifestPath)||!existsSync(gradlePath)){
 console.error('Expo prebuild did not generate Android manifest and Gradle app.');process.exit(1);
}
const manifest=readFileSync(manifestPath,'utf8'),gradle=readFileSync(gradlePath,'utf8');
const errors=[];
if(!manifest.includes('android.permission.RECORD_AUDIO'))errors.push('RECORD_AUDIO permission not declared');
if(!manifest.includes('<application'))errors.push('Missing Android application manifest');
if(!gradle.includes('com.oswhgo.voicefirst'))errors.push('Incorrect generated application ID');
if(/FOREGROUND_SERVICE_MICROPHONE/.test(manifest)&&!manifest.includes('android.permission.FOREGROUND_SERVICE_MICROPHONE'))
 errors.push('Unexpected foreground recording service');
if(errors.length){console.error('Android native source check failed:',errors.join('; '));process.exit(1);}
console.log('Generated Android native source validated:',manifestPath);
console.log('Checked package identifier and RECORD_AUDIO permission. No APK was compiled.');
