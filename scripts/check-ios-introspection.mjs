#!/usr/bin/env node
/** Inspect iOS microphone and Speech Recognition privacy declarations via Expo
 * config plugins without Xcode, a paid Apple account or a native simulator.
 * Static introspection does not prove physical microphone or ASR operation.
 */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const r=spawnSync('npx',['--no-install','expo','config','--type','introspect','--json'],
 {cwd:join(root,'mobile'),encoding:'utf8',env:{...process.env,EXPO_NO_TELEMETRY:'1',CI:'1'},
 timeout:120000,maxBuffer:10*1024*1024});
if(r.status!==0){
 console.error('Expo iOS native configuration introspection failed.',(r.stderr||r.stdout||'').slice(-2000));
 process.exit(1);
}
let config;
try{config=JSON.parse(r.stdout);}catch{console.error('Expo iOS introspection did not return JSON');process.exit(1);}
const plist=config?._internal?.modResults?.ios?.infoPlist;
if(!plist||typeof plist!=='object'){
 console.error('iOS native Info.plist result not exposed by config plugins.');process.exit(1);
}
const microphone=plist.NSMicrophoneUsageDescription;
const speech=plist.NSSpeechRecognitionUsageDescription;
if(typeof microphone!=='string'||microphone.trim().length<20){
 console.error('iOS microphone usage description absent or inadequate.');process.exit(1);
}
if(typeof speech!=='string'||speech.trim().length<20){
 console.error('iOS speech recognition usage description absent or inadequate.');process.exit(1);
}
if(Array.isArray(plist.UIBackgroundModes)&&plist.UIBackgroundModes.includes('audio')){
 console.error('Background audio unexpectedly enabled in native iOS privacy metadata.');process.exit(1);
}
console.log('Expo iOS native privacy metadata validated: microphone + speech permissions; no background audio.');
console.log('This is plugin introspection on Linux, NOT an iOS Simulator build or installed iPhone app.');
