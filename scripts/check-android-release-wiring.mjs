#!/usr/bin/env node
/** Verify Expo-generated Android release Gradle wiring without compiling an APK.
 * The Expo/RN template must bundle JS assets for non-debuggable variants.
 */
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mobile=join(root,'mobile');
const r=spawnSync('npx',['--no-install','expo','prebuild','--platform','android','--no-install','--clean'],{
 cwd:mobile,encoding:'utf8',timeout:180000,maxBuffer:3*1024*1024,
 env:{...process.env,CI:'1',EXPO_NO_TELEMETRY:'1',EXPO_NO_GIT_STATUS:'1'}
});
if(r.status!==0){console.error((r.stderr||r.stdout||'prebuild failed').slice(-3000));process.exit(1);}
const app=join(mobile,'android','app','build.gradle');
if(!existsSync(app))throw Error('Missing generated app/build.gradle');
const s=readFileSync(app,'utf8');
const checks={
 reactNativeGradlePlugin:/com\.facebook\.react/.test(s),
 releaseVariant:/release\s*\{/.test(s),
 expoBundlingHook:/expo\/scripts\/resolveAppEntry|expo\/bin\/cli/.test(s),
 releaseNotMarkedDebuggable:!/debuggableVariants\s*=\s*\[[^\]]*release/.test(s)
};
console.log(JSON.stringify({checks,source:app,interpretation:'Gradle source readiness only: does not prove APK contains a JS bundle or runs offline.'},null,2));
if(Object.values(checks).some(x=>!x))process.exit(1);
