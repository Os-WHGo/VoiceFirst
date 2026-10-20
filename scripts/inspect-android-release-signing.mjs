#!/usr/bin/env node
/** Read-only native-release readiness: inspect Gradle source without compiling APK. */
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=process.cwd();
const file=join(root,'mobile/android/app/build.gradle');
if(!existsSync(file))throw Error('Android prebuild output missing; run Expo prebuild first.');
const gradle=readFileSync(file,'utf8');
const releaseBlock=gradle.match(/release\s*\{([\s\S]*?)\n\s*\}/)?.[1]??'';
const signingConfigs=[...gradle.matchAll(/signingConfigs\.([A-Za-z0-9_]+)/g)].map(x=>x[1]);
const result={
 releaseVariantPresent:releaseBlock.length>0,
 releaseSigningReferences:signingConfigs,
 releaseExplicitlyDebuggable:/debuggable\s+true\b/.test(releaseBlock),
 releaseReferencesDebugSigning:/signingConfig\s+signingConfigs\.debug\b/.test(releaseBlock),
 interpretation:'Static Gradle inspection only. No APK, signature verification, production signing, installability or offline device test.'
};
console.log(JSON.stringify(result,null,2));
if(!result.releaseVariantPresent||result.releaseExplicitlyDebuggable)process.exitCode=1;
